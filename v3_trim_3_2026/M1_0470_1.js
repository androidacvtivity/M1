// M1 - eDec V3 / Drupal 11
// Functional port of TRIM_3_2026/M1_12.js without jQuery.

function m1-newGetElementValue(selector) {
    var element = document.querySelector(selector);
    return element && element.value != null ? element.value : '';
}

function m1-newGetHeaderSelectValue(tableSelector, columnNumber) {
    var selector = tableSelector + ' thead tr td:nth-child(' + columnNumber + ') select';
    var element = document.querySelector(selector);
    return element && element.value != null ? element.value : '';
}

(function (Drupal, drupalSettings) {
    'use strict';

    Drupal.behaviors.m1-new = {
        attach: function (context, settings) {
            var root = context || document;
            var form = null;

            if (root.matches && root.matches('#mywebform-edit-form')) {
                form = root;
            } else if (root.querySelector) {
                form = root.querySelector('#mywebform-edit-form');
            }

            if (!form) {
                form = document.querySelector('#mywebform-edit-form');
            }

            if (!form) {
                return;
            }

            function matchesTarget(target, selector) {
                return target && target.matches && target.matches(selector);
            }

            function dispatchChange(element) {
                if (!element) {
                    return;
                }

                element.dispatchEvent(new Event('change', { bubbles: true }));
            }

            function updateInternalFieldValue(fieldName, value) {
                if (
                    drupalSettings &&
                    drupalSettings.mywebform &&
                    drupalSettings.mywebform.values
                ) {
                    drupalSettings.mywebform.values[fieldName] = value;
                }
            }

            function setFieldValue(fieldSelector, value) {
                var field = document.querySelector(fieldSelector);

                if (!field) {
                    return;
                }

                var normalizedValue = value == null ? '' : String(value);
                var fieldName = field.getAttribute('name') || field.id || field.getAttribute('field') || '';
                var changed = field.value !== normalizedValue;

                field.value = normalizedValue;

                if (fieldName) {
                    updateInternalFieldValue(fieldName, normalizedValue);
                }

                if (changed) {
                    dispatchChange(field);
                }
            }

            function getTrimValue() {
                return Number(m1-newGetElementValue('select[name="TRIM"]'));
            }

            function fillMainCaemFieldsM1() {
                var caem = m1-newGetElementValue('#CAEM') || '';
                var trimValue = getTrimValue();

                // CAEM din foaia de titlu -> Cap.1, col.2.
                setFieldValue('#CAP1_CAEM_C2', caem);
                updateInternalFieldValue('CAP1_CAEM_C2', caem);

                // Pentru trimestrul III -> Cap.2, col.2.
                if (trimValue === 3) {
                    setFieldValue('#CAP2_CAEM_C2', caem);
                    updateInternalFieldValue('CAP2_CAEM_C2', caem);
                }
            }

            function syncCap1CaemToCap2(columnNumber) {
                if (getTrimValue() !== 3) {
                    return;
                }

                var sourceFieldName = 'CAP1_CAEM_C' + columnNumber;
                var targetFieldName = 'CAP2_CAEM_C' + columnNumber;
                var caem = m1-newGetElementValue('#' + sourceFieldName) || '';

                setFieldValue('#' + targetFieldName, caem);
                updateInternalFieldValue(targetFieldName, caem);
            }

            function syncAllCap1CaemToCap2() {
                for (var columnNumber = 2; columnNumber <= 12; columnNumber++) {
                    syncCap1CaemToCap2(columnNumber);
                }
            }

            function getCap1CaemColumn(element) {
                if (!element) {
                    return null;
                }

                var fieldName =
                    element.getAttribute('name') ||
                    element.id ||
                    element.getAttribute('field') ||
                    '';

                var matches = fieldName.match(/^CAP1_CAEM_C(\d+)$/);
                return matches ? Number(matches[1]) : null;
            }

            function getVisibleSelectElement(field) {
                if (!field) {
                    return null;
                }

                var sibling = field.nextElementSibling;
                if (sibling && sibling.classList && sibling.classList.contains('select2-container')) {
                    return sibling.querySelector('.select2-selection--single') || sibling;
                }

                return field;
            }

            function removeCaemDuplicateMessages(chapterPrefix) {
                document
                    .querySelectorAll('.m1-new-caem-duplicate-message-' + chapterPrefix)
                    .forEach(function (message) {
                        message.remove();
                    });

                document
                    .querySelectorAll('select[name^="' + chapterPrefix + '_CAEM_C"]')
                    .forEach(function (field) {
                        field.classList.remove('m1-new-caem-duplicate-field');

                        var visualElement = getVisibleSelectElement(field);
                        if (visualElement) {
                            visualElement.style.border = '';
                            visualElement.style.boxShadow = '';
                        }
                    });
            }

            function showCaemDuplicateMessage(chapterPrefix, columnNumber, duplicateColumnNumber) {
                var field = document.querySelector(
                    '#' + chapterPrefix + '_CAEM_C' + columnNumber
                );

                if (!field) {
                    return;
                }

                field.classList.add('m1-new-caem-duplicate-field');

                var visualElement = getVisibleSelectElement(field);
                if (visualElement) {
                    visualElement.style.border = '1px solid #b94a48';
                    visualElement.style.boxShadow = '0 0 3px rgba(185, 74, 72, 0.5)';
                }

                var message = document.createElement('div');
                message.className = 'm1-new-caem-duplicate-message-' + chapterPrefix;
                message.style.color = '#b94a48';
                message.style.fontSize = '12px';
                message.style.fontWeight = 'bold';
                message.style.lineHeight = '1.3';
                message.style.marginTop = '4px';
                message.textContent =
                    'Codul CAEM2 este deja selectat în coloana ' +
                    duplicateColumnNumber +
                    '.';

                var insertAfter = field;
                var sibling = field.nextElementSibling;
                if (sibling && sibling.classList && sibling.classList.contains('select2-container')) {
                    insertAfter = sibling;
                }

                insertAfter.insertAdjacentElement('afterend', message);
            }

            function validateCaemDuplicatesInline(chapterPrefix) {
                removeCaemDuplicateMessages(chapterPrefix);

                var selectedCaemColumns = Object.create(null);

                for (var columnNumber = 2; columnNumber <= 12; columnNumber++) {
                    var caem = m1-newGetElementValue(
                        '#' + chapterPrefix + '_CAEM_C' + columnNumber
                    );

                    caem = String(caem || '').trim();

                    if (caem === '') {
                        continue;
                    }

                    if (Object.prototype.hasOwnProperty.call(selectedCaemColumns, caem)) {
                        if (columnNumber >= 3) {
                            showCaemDuplicateMessage(
                                chapterPrefix,
                                columnNumber,
                                selectedCaemColumns[caem]
                            );
                        }
                    } else {
                        selectedCaemColumns[caem] = columnNumber;
                    }
                }
            }

            function validateAllCaemDuplicatesInline() {
                validateCaemDuplicatesInline('CAP1');

                if (getTrimValue() === 3) {
                    validateCaemDuplicatesInline('CAP2');
                } else {
                    removeCaemDuplicateMessages('CAP2');
                }
            }

            function setVisible(selector, visible) {
                document.querySelectorAll(selector).forEach(function (element) {
                    element.style.display = visible ? '' : 'none';
                });
            }

            function clearCap2Values() {
                document.querySelectorAll('input[name^="CAP2"]').forEach(function (input) {
                    if (input.value !== '') {
                        input.value = '';
                        var fieldName = input.getAttribute('name') || input.id || input.getAttribute('field') || '';
                        if (fieldName) {
                            updateInternalFieldValue(fieldName, '');
                        }
                        dispatchChange(input);
                    }
                });

                document.querySelectorAll('select[name^="CAP2_CAEM"]').forEach(function (select) {
                    if (select.value !== '') {
                        select.value = '';
                        var fieldName = select.getAttribute('name') || select.id || select.getAttribute('field') || '';
                        if (fieldName) {
                            updateInternalFieldValue(fieldName, '');
                        }
                        dispatchChange(select);
                    }

                    var visualElement = getVisibleSelectElement(select);
                    if (visualElement) {
                        visualElement.setAttribute('tabindex', '0');
                    }
                });
            }

            function toggleCap2(trimValue) {
                var showCap2 = Number(trimValue) === 3;
                var cap2Rows =
                    '#row-header-1, #row-header-2, #row-header-3, ' +
                    '#row-10, #row-20, #row-30, #row-40, #row-50, #row-60, ' +
                    '#row-70, #row-80, #row-90, #row-100, #row-110, #row-120, ' +
                    '#row-160, #Caption_Cap2';

                setVisible('#header-1-2', showCap2);
                setVisible('#CAP2', showCap2);
                setVisible(cap2Rows, showCap2);

                if (!showCap2) {
                    clearCap2Values();
                    removeCaemDuplicateMessages('CAP2');
                }
            }

            function handleCaemChange(target) {
                if (matchesTarget(target, '#CAEM')) {
                    updateInternalFieldValue('CAEM', target.value || '');
                    fillMainCaemFieldsM1();
                    validateAllCaemDuplicatesInline();
                    return;
                }

                if (matchesTarget(target, 'select[name^="CAP1_CAEM_C"]')) {
                    var columnNumber = getCap1CaemColumn(target);
                    if (columnNumber !== null && columnNumber >= 2 && columnNumber <= 12) {
                        syncCap1CaemToCap2(columnNumber);
                    }
                    validateCaemDuplicatesInline('CAP1');
                    return;
                }

                if (matchesTarget(target, 'select[name^="CAP2_CAEM_C"]')) {
                    validateCaemDuplicatesInline('CAP2');
                }
            }

            if (!form.dataset.m1-newNativeEventsBound) {
                form.dataset.m1-newNativeEventsBound = '1';

                form.addEventListener('mywebform:gridRefreshField', function (event) {
                    var target = event.target;
                    if (!matchesTarget(target, 'input.dynamic-region')) {
                        return;
                    }

                    var value = target.value;
                    if (value === null || value === undefined) {
                        console.warn('Input value is null or undefined');
                        return;
                    }

                    var processedValue = String(value).trim();
                    if (value !== processedValue) {
                        target.value = processedValue;
                        dispatchChange(target);
                    }
                });

                form.addEventListener('keypress', function (event) {
                    var target = event.target;
                    if (
                        matchesTarget(target, 'input.numeric') ||
                        matchesTarget(target, 'input.money') ||
                        matchesTarget(target, 'input.float')
                    ) {
                        if (isNumberPressed(target, event) === false) {
                            event.preventDefault();
                        }
                    }
                });

                form.addEventListener('paste', function (event) {
                    var target = event.target;
                    if (
                        !matchesTarget(target, 'input.numeric') &&
                        !matchesTarget(target, 'input.money') &&
                        !matchesTarget(target, 'input.float')
                    ) {
                        return;
                    }

                    if (!event.clipboardData) {
                        return;
                    }

                    var value = event.clipboardData.getData('text/plain').trim();
                    var isNumeric = /^[+-]?\d+(\.\d+)?$/.test(value);
                    var number = isNumeric ? Number(value) : NaN;

                    if (!isNumeric || isNaN(number) || is_negative(number)) {
                        event.preventDefault();
                        console.warn(
                            'Pasted value is not a valid number or is negative:',
                            value
                        );
                        return;
                    }

                    event.preventDefault();
                    target.value = String(number);
                    dispatchChange(target);
                });

                form.addEventListener('change', function (event) {
                    var target = event.target;

                    if (matchesTarget(target, 'select[name="TRIM"]')) {
                        var trimValue = target.value;
                        toggleCap2(trimValue);
                        fillMainCaemFieldsM1();

                        if (Number(trimValue) === 3) {
                            syncAllCap1CaemToCap2();
                        }

                        validateAllCaemDuplicatesInline();
                        return;
                    }

                    handleCaemChange(target);
                });

                form.addEventListener('mywebform:sync', function (event) {
                    handleCaemChange(event.target);
                });

                // Compatibilitate cu componente care emit aceste CustomEvent-uri în V3.
                form.addEventListener('select2:select', function (event) {
                    handleCaemChange(event.target);
                });
                form.addEventListener('select2:unselect', function (event) {
                    handleCaemChange(event.target);
                });
            }

            var initialTrimValue = m1-newGetElementValue('select[name="TRIM"]');
            toggleCap2(initialTrimValue);
            fillMainCaemFieldsM1();

            if (Number(initialTrimValue) === 3) {
                syncAllCap1CaemToCap2();
            }

            validateAllCaemDuplicatesInline();
        }
    };
})(Drupal, drupalSettings);

function validate_76_008(values) {
    for (var col = 1; col <= 12; col++) {

        var CAP1_R30 = parseFloat(values['CAP1_R30_C' + col]);
        var CAP1_R70 = parseFloat(values['CAP1_R70_C' + col]);

        if (isNaN(CAP1_R30)) {
            CAP1_R30 = 0;
        }

        if (isNaN(CAP1_R70)) {
            CAP1_R70 = 0;
        }

        if (CAP1_R70 !== 0 && CAP1_R30 === 0) {
            webform.warnings.push({
                'fieldName': 'CAP1_R30_C' + col,
                'weight': 8,
                'msg': Drupal.t(
                    'Cod atenționare: 05-013 - Cap.I: Dacă există R.70 trebuie completat R.30, Col.@col.',
                    {
                        '@col': col
                    }
                )
            });
        }

        if (CAP1_R30 !== 0 && CAP1_R70 === 0) {
            webform.warnings.push({
                'fieldName': 'CAP1_R70_C' + col,
                'weight': 8,
                'msg': Drupal.t(
                    'Cod atenționare: 05-013 - Cap.I: Dacă există R.30 trebuie completat R.70, Col.@col.',
                    {
                        '@col': col
                    }
                )
            });
        }
    }
}

function safeDivide(numerator, denominator) {
    numerator = parseFloat(numerator);
    denominator = parseFloat(denominator);

    if (
        isNaN(numerator) ||
        isNaN(denominator) ||
        denominator === 0
    ) {
        return 0;
    }

    return numerator / denominator;
}


function validate_05_003(values) {
    var rows = [71, 72, 73, 74];

    for (var col = 1; col <= 12; col++) {

        var CAP1_R70 = parseFloat(
            values['CAP1_R70_C' + col]
        );

        if (isNaN(CAP1_R70)) {
            CAP1_R70 = 0;
        }

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            var rowValue = parseFloat(
                values['CAP1_R' + row + '_C' + col]
            );

            if (isNaN(rowValue)) {
                rowValue = 0;
            }

            if (rowValue > CAP1_R70) {
                webform.errors.push({
                    'fieldName':
                        'CAP1_R' + row + '_C' + col,

                    'weight': 3,

                    'msg': Drupal.t(
                        'Cod eroare: 05-003 - Cap.I: R.@row ≤ R.70, Col.@col. -> [@rowValue] ≤ [@CAP1_R70]',
                        {
                            '@row': row,
                            '@col': col,
                            '@rowValue': rowValue,
                            '@CAP1_R70': CAP1_R70
                        }
                    )
                });
            }
        }
    }
}

//----------------------------------

function validate_05_013(values) {
    for (var col = 1; col <= 12; col++) {

        var CAP1_R30 = parseFloat(
            values['CAP1_R30_C' + col]
        );

        var CAP1_R31 = parseFloat(
            values['CAP1_R31_C' + col]
        );

        if (isNaN(CAP1_R30)) {
            CAP1_R30 = 0;
        }

        if (isNaN(CAP1_R31)) {
            CAP1_R31 = 0;
        }

        if (CAP1_R31 > CAP1_R30) {
            webform.errors.push({
                'fieldName': 'CAP1_R31_C' + col,
                'weight': 13,
                'msg': Drupal.t(
                    'Cod eroare: 05-013 - Cap.I: R.31 ≤ R.30, Col.@col. -> [@CAP1_R31] ≤ [@CAP1_R30]',
                    {
                        '@col': col,
                        '@CAP1_R31': CAP1_R31,
                        '@CAP1_R30': CAP1_R30
                    }
                )
            });
        }
    }
}
//--------------------------------


function validate_05_028(values) {
    for (var col = 1; col <= 12; col++) {

        var CAP1_R10 = parseFloat(
            values['CAP1_R10_C' + col]
        );

        var CAP1_R30 = parseFloat(
            values['CAP1_R30_C' + col]
        );

        if (isNaN(CAP1_R10)) {
            CAP1_R10 = 0;
        }

        if (isNaN(CAP1_R30)) {
            CAP1_R30 = 0;
        }

        if (CAP1_R30 > CAP1_R10) {
            webform.warnings.push({
                'fieldName': 'CAP1_R30_C' + col,
                'weight': 28,
                'msg': Drupal.t(
                    'Cod atenționare: 05-028 - Cap.I: R.30 ≤ R.10, Col.@col. -> [@CAP1_R30] ≤ [@CAP1_R10]',
                    {
                        '@col': col,
                        '@CAP1_R30': CAP1_R30,
                        '@CAP1_R10': CAP1_R10
                    }
                )
            });
        }
    }
}
//--------------------------------
function validate_05_043(values) {
    for (var col = 1; col <= 12; col++) {

        var CAP1_R30 = parseFloat(
            values['CAP1_R30_C' + col]
        );

        var CAP1_R40 = parseFloat(
            values['CAP1_R40_C' + col]
        );

        var CAP1_R70 = parseFloat(
            values['CAP1_R70_C' + col]
        );

        var CAP1_R73 = parseFloat(
            values['CAP1_R73_C' + col]
        );

        if (isNaN(CAP1_R30)) {
            CAP1_R30 = 0;
        }

        if (isNaN(CAP1_R40)) {
            CAP1_R40 = 0;
        }

        if (isNaN(CAP1_R70)) {
            CAP1_R70 = 0;
        }

        if (isNaN(CAP1_R73)) {
            CAP1_R73 = 0;
        }

        // Dacă R.40 > 0 și R.30 = 0,
        // atunci R.70 trebuie să fie egal cu R.73.
        if (
            CAP1_R40 > 0 &&
            CAP1_R30 === 0 &&
            CAP1_R70 !== CAP1_R73
        ) {
            webform.errors.push({
                'fieldName': 'CAP1_R70_C' + col,
                'weight': 43,
                'msg': Drupal.t(
                    'Cod eroare: 05-043 - Cap.I: Dacă R.40 > 0 și R.30 = 0, atunci R.70 = R.73, Col.@col.',
                    {
                        '@col': col
                    }
                )
            });
        }

        // Invers:
        // dacă R.70 = R.73 și valoarea este diferită de 0,
        // atunci trebuie R.40 > 0 și R.30 = 0.
        if (
            CAP1_R70 === CAP1_R73 &&
            CAP1_R70 !== 0 &&
            (
                CAP1_R40 === 0 ||
                CAP1_R30 > 0
            )
        ) {
            webform.errors.push({
                'fieldName': 'CAP1_R70_C' + col,
                'weight': 43,
                'msg': Drupal.t(
                    'Cod eroare: 05-043 - Cap.I: Dacă R.70 = R.73, atunci trebuie R.40 > 0 și R.30 = 0, Col.@col.',
                    {
                        '@col': col
                    }
                )
            });
        }
    }
}
//-

function validate_05_036(values) {
    for (var col = 1; col <= 12; col++) {

        var CAP1_R30 = parseFloat(
            values['CAP1_R30_C' + col]
        );

        var CAP1_R70 = parseFloat(
            values['CAP1_R70_C' + col]
        );

        var CAP1_R73 = parseFloat(
            values['CAP1_R73_C' + col]
        );

        if (isNaN(CAP1_R30)) {
            CAP1_R30 = 0;
        }

        if (isNaN(CAP1_R70)) {
            CAP1_R70 = 0;
        }

        if (isNaN(CAP1_R73)) {
            CAP1_R73 = 0;
        }

        if (CAP1_R30 > 0) {

            var calcul2 =
                ((CAP1_R70 - CAP1_R73) * 1000 / CAP1_R30) / 3;

            calcul2 = Math.round(calcul2 * 10) / 10;

            if (
                calcul2 < 6300 ||
                calcul2 > 20000
            ) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R70_C' + col,
                    'weight': 36,
                    'msg': Drupal.t(
                        'Cod atenționare: 05-036 - Cap.I: ((R.70 - R.73) * 1000 / R.30) / 3 trebuie să fie între 6300 și 20000, Col.@col. -> [@sum]',
                        {
                            '@col': col,
                            '@sum': calcul2
                        }
                    )
                });
            }
        }
    }
}

//--------------------------------

function validate_05_037(values) {
    for (var col = 1; col <= 12; col++) {

        var CAP1_R31 = parseFloat(
            values['CAP1_R31_C' + col]
        );

        var CAP1_R74 = parseFloat(
            values['CAP1_R74_C' + col]
        );

        if (isNaN(CAP1_R31)) {
            CAP1_R31 = 0;
        }

        if (isNaN(CAP1_R74)) {
            CAP1_R74 = 0;
        }

        if (CAP1_R31 > 0) {

            var calcul3 =
                ((CAP1_R74 * 1000) / CAP1_R31) / 3;

            calcul3 = Math.round(calcul3 * 10) / 10;

            if (
                calcul3 < 10000 ||
                calcul3 > 20000
            ) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R74_C' + col,
                    'weight': 37,
                    'msg': Drupal.t(
                        'Cod atenționare: 05-037 - Cap.I: (R.74 * 1000 / R.31) / 3 trebuie să fie între 10000 și 20000, Col.@col. -> [@sum]',
                        {
                            '@col': col,
                            '@sum': calcul3
                        }
                    )
                });
            }
        }
    }
}
//--------------------------------

function validate_05_039(values) {
    for (var col = 1; col <= 12; col++) {

        var CAP1_R40 = parseFloat(
            values['CAP1_R40_C' + col]
        );

        var CAP1_R73 = parseFloat(
            values['CAP1_R73_C' + col]
        );

        if (isNaN(CAP1_R40)) {
            CAP1_R40 = 0;
        }

        if (isNaN(CAP1_R73)) {
            CAP1_R73 = 0;
        }

        if (CAP1_R40 > 0) {

            var calcul4 =
                ((CAP1_R73 * 1000) / CAP1_R40) / 3;

            calcul4 = Math.round(calcul4 * 10) / 10;

            if (
                calcul4 < 6300 ||
                calcul4 > 20000
            ) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R73_C' + col,
                    'weight': 39,
                    'msg': Drupal.t(
                        'Cod atenționare: 05-039 - Cap.I: (R.73 * 1000 / R.40) / 3 trebuie să fie între 6300 și 20000, Col.@col. -> [@sum]',
                        {
                            '@col': col,
                            '@sum': calcul4
                        }
                    )
                });
            }
        }
    }
}
//--------------------------------
webform.validators.m1-new = function (v, allowOverpass) {
    var values = drupalSettings.mywebform.values;
   // var values = drupalSettings.mywebform.values;
    validatePhoneNumber(values.PHONE);
    validateCAEM_COL1_CAP1(values.CAEM);
    validate_76_008(values);
    validate_05_003(values);
    validate_05_013(values);
    validate_05_028(values);
    validate_05_043(values);
    validate_05_036(values);
    validate_05_039(values);
    validate_05_037(values);
    //
    function roundToDecimal(value, decimals) {
        if (!isNaN(value)) {
            var factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        } else {
            console.warn("Value provided is not a number:", value);
            return 0; // Default fallback value
        }
    }

    //
    var cap2Errors = validateCap2SumAndTrim(values);
    if (cap2Errors && cap2Errors.length > 0) {
        for (var i = 0; i < cap2Errors.length; i++) {
            webform.errors.push(cap2Errors[i]);
        }
    }
    //--------------------------------------------

    // Apelăm funcția de validare pentru CAEM2
    var caem2Errors = validateCAEM2(values);
    if (caem2Errors && caem2Errors.length > 0) {
        for (var i = 0; i < caem2Errors.length; i++) {
            webform.errors.push(caem2Errors[i]);

        }
    }

    // Check if the field is empty or has more than 9 digits
    function validatePhoneNumber(phone) {
        // Check if the phone number is valid (exactly 9 digits)
        if (!values.PHONE || !/^[0-9]{9}$/.test(values.PHONE)) {
            webform.errors.push({
                'fieldName': 'PHONE',
                'msg': Drupal.t(' Cod eroare: A.09 Introduceți doar un număr de telefon format din 9 cifre')
            });
        }
        // Check if the first digit is 0
        if (values.PHONE && values.PHONE[0] !== '0') {
            webform.errors.push({
                'fieldName': 'PHONE',
                'msg': Drupal.t(' Cod eroare: A.09 Prima cifră a numărului de telefon trebuie să fie 0')
            });
        }
    }


    // Start 05-00(3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 21, 22, 23, 25, 28, 30, 36, 37, 39, 40, 42, 43, 44, 50, 51)
    var arr_CAP1_inputs_1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    var arr_CAP1_L = ['10', '20', '30', '31', '40', '50', '51', '52', '70', '71', '72', '73', '74'];
    var valid_ = 0;
    for (var j = 0; j < arr_CAP1_inputs_1.length; j++) {
        for (var l = 0; l < arr_CAP1_L.length; l++) {
            if (!isNaN(parseFloat(values['CAP1_R' + arr_CAP1_L[l] + '_C' + arr_CAP1_inputs_1[j]]))) {
                valid_ = 1;
            }
        }
    }
    if (valid_ == 1) {
        var arr_CAP1_inputs_2 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        for (var i = 0; i < arr_CAP1_inputs_2.length; i++) {

            // Start 05-021
            var fields_CAP1_CAEM2 = m1-newGetHeaderSelectValue('#CAP1', arr_CAP1_inputs_2[i]);

            var CAP1_R10 = 0;
            if (!isNaN(parseFloat(values['CAP1_R10_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R10 = parseFloat(values['CAP1_R10_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R10_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R20 = 0;
            if (!isNaN(parseFloat(values['CAP1_R20_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R20 = parseFloat(values['CAP1_R20_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R20_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R30 = 0;
            if (!isNaN(parseFloat(values['CAP1_R30_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R30 = parseFloat(values['CAP1_R30_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R31 = 0;
            if (!isNaN(parseFloat(values['CAP1_R31_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R31 = parseFloat(values['CAP1_R31_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R31_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R40 = 0;
            if (!isNaN(parseFloat(values['CAP1_R40_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R40 = parseFloat(values['CAP1_R40_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R40_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R50 = 0;
            if (!isNaN(parseFloat(values['CAP1_R50_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R50 = parseFloat(values['CAP1_R50_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R50_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R51 = 0;
            if (!isNaN(parseFloat(values['CAP1_R51_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R51 = parseFloat(values['CAP1_R51_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R51_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R52 = 0;
            if (!isNaN(parseFloat(values['CAP1_R52_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R52 = parseFloat(values['CAP1_R52_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R52_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R70 = 0;
            if (!isNaN(parseFloat(values['CAP1_R70_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R70 = parseFloat(values['CAP1_R70_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R71 = 0;
            if (!isNaN(parseFloat(values['CAP1_R71_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R71 = parseFloat(values['CAP1_R71_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R71_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R72 = 0;
            if (!isNaN(parseFloat(values['CAP1_R72_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R72 = parseFloat(values['CAP1_R72_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R72_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R73 = 0;
            if (!isNaN(parseFloat(values['CAP1_R73_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R73 = parseFloat(values['CAP1_R73_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R73_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R74 = 0;
            if (!isNaN(parseFloat(values['CAP1_R74_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R74 = parseFloat(values['CAP1_R74_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R74_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R120 = 0;
            if (!isNaN(parseFloat(values['CAP1_R120_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R120 = parseFloat(values['CAP1_R120_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R120_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            var CAP1_R200 = 0;
            if (!isNaN(parseFloat(values['CAP1_R200_C' + arr_CAP1_inputs_2[i]]))) {
                CAP1_R200 = parseFloat(values['CAP1_R200_C' + arr_CAP1_inputs_2[i]]);
                if (fields_CAP1_CAEM2 == '') {
                    webform.errors.push({
                        'fieldName': 'CAP1_R200_C' + arr_CAP1_inputs_2[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                    });
                }
            }
            // End 05-021

//             // Start 05-003 --  aceasta  validare eu vreau sa o comentezi si sa facem o functie si sa o adaugam
//             // dar validarea trebuie
//             // Cap.I Rind 71 <= rind 70 pe toate col
//             // Cap.I Rind 72 <= rind 70 pe toate col
//             // Cap.I Rind 73 <= rind 70 pe toate col
//             // Cap.I Rind 74 <= rind 70 pe toate col

//             if (CAP1_R70 < CAP1_R71) {
//                 webform.errors.push({
//                     'fieldName': 'CAP1_R71_C' + arr_CAP1_inputs_2[i],
//                     'weight': 3,
//                     'msg': Drupal.t('Cod eroare: 05-003 - Cap.1: R.71 ≤ R.70 pe toate coloanele. -> [@CAP1_R71] ≤ [@CAP1_R70]', { '@CAP1_R71': CAP1_R71, '@CAP1_R70': CAP1_R70 })
//                 });
//             }

// //

            // Start 05-007
            var sum_CAP1_R71_074 = CAP1_R71 + CAP1_R72 + CAP1_R73 + CAP1_R74;
            sum_CAP1_R71_074 = roundToDecimal(sum_CAP1_R71_074, 1);
            if (CAP1_R70 < sum_CAP1_R71_074) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                    'weight': 7,
                    'msg': Drupal.t('Cod atenționare: 05-007 - Cap.1: Suma R.(71, 72, 73, 74) ≤ R.70 -> [@sum_CAP1_R71_074] ≤ [@CAP1_R70]', { '@sum_CAP1_R71_074': sum_CAP1_R71_074, '@CAP1_R70': CAP1_R70 })
                });
            }
            // End 05-007

            // Start 05-009
            if (CAP1_R20 > CAP1_R10) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R20_C' + arr_CAP1_inputs_2[i],
                    'weight': 9,
                    'msg': Drupal.t('Cod atenționare: 05-009 - Cap.1: R.20 ≤ R.10 -> [@CAP1_R20] ≤ [@CAP1_R10]', { '@CAP1_R20': CAP1_R20, '@CAP1_R10': CAP1_R10 })
                });
            }
            // End 05-009

            // Start 05-010
            if (CAP1_R40 > CAP1_R30) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R40_C' + arr_CAP1_inputs_2[i],
                    'weight': 10,
                    'msg': Drupal.t('Cod atenționare: 05-010 - Cap.1: R.40 ≤ R.30 -> [@CAP1_R40] ≤ [@CAP1_R30]', { '@CAP1_R40': CAP1_R40, '@CAP1_R30': CAP1_R30 })
                });
            }
            // End 05-010

            // Start 05-012
            var raport1 = CAP1_R30 + CAP1_R40; // This is a number with one digit after the decimal point
            if (raport1 > 0) {
                var calcul1 = (CAP1_R50 * 1000) / raport1; // calcul1 is a number
                //calcul1 = Math.round(calcul1 * 10) / 10; // Now calcul1 is rounded to one decimal place as a number
                calcul1 = roundToDecimal(calcul1, 1);
                if (calcul1 > 570 || calcul1 < 450) {
                    webform.warnings.push({
                        'fieldName': 'CAP1_R50_C' + arr_CAP1_inputs_2[i],
                        'weight': 12,
                        'msg': Drupal.t('Cod atenționare: 05-012 - Cap.1: R.50 * 1000 / (R.30 + R.40) ≤ 570 și > 450 pe toate coloanele. -> [@sum]', { '@sum': calcul1 })
                    });
                }
            }
            // End 05-012



            // Start 05-023
            if (CAP1_R50 > 0 && CAP1_R30 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                    'weight': 23,
                    'msg': Drupal.t('Cod atenționare: 05-023 - Cap.1: Dacă există R.30 ar trebui să fie și R.50 și invers, pentru toate coloanele.')
                });
            }
            if (CAP1_R30 > 0 && CAP1_R50 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                    'weight': 23,
                    'msg': Drupal.t('Cod atenționare: 05-023 - Cap.1: Dacă există R.30 ar trebui să fie și R.50 și invers, pentru toate coloanele.')
                });
            }
            // End 05-023

            // Start 05-025
            if (CAP1_R31 > 0 && CAP1_R74 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R74_C' + arr_CAP1_inputs_2[i],
                    'weight': 25,
                    'msg': Drupal.t('Cod atenționare: 05-025 - Cap.1: Dacă există R.31 ar trebui să fie R.74 și invers, pe toate coloanele.')
                });
            }
            if (CAP1_R74 > 0 && CAP1_R31 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R74_C' + arr_CAP1_inputs_2[i],
                    'weight': 25,
                    'msg': Drupal.t('Cod atenționare: 05-025 - Cap.1: Dacă există R.31 ar trebui să fie R.74 și invers, pe toate coloanele.')
                });
            }
            //End 05-025



            // Start 05-030
            if (CAP1_R40 > 0 && CAP1_R73 == 0) {
                webform.errors.push({
                    'fieldName': 'CAP1_R73_C' + arr_CAP1_inputs_2[i],
                    'weight': 30,
                    'msg': Drupal.t('Cod eroare: 05-030 - Cap.1: Dacă există R.40 ar trebui să fie R.73 și invers, pe toate coloanele.')
                });
            }
            if (CAP1_R73 > 0 && CAP1_R40 == 0) {
                webform.errors.push({
                    'fieldName': 'CAP1_R40_C' + arr_CAP1_inputs_2[i],
                    'weight': 30,
                    'msg': Drupal.t('Cod eroare: 05-030 - Cap.1: Dacă există R.40 ar trebui să fie R.73 și invers, pe toate coloanele.')
                });
            }
            // End 05-030

            // Start 05-040
            if (CAP1_R10 > 0 && CAP1_R30 == 0) {
                webform.errors.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                    'weight': 40,
                    'msg': Drupal.t('Cod eroare: 05-040 - Cap.1: Dacă există R.10 ar trebui să fie R.30, pe toate coloanele.')
                });
            }
            // End 05-040

            // Start 05-042
            if (!isNaN(parseFloat(values['CAP1_R50_C' + arr_CAP1_inputs_2[i]])) || !isNaN(parseFloat(values['CAP1_R51_C' + arr_CAP1_inputs_2[i]]))) {
                if (CAP1_R51 <= CAP1_R52 && (CAP1_R51 > 0 || CAP1_R52 > 0)) {
                    webform.errors.push({
                        'fieldName': 'CAP1_R51_C' + arr_CAP1_inputs_2[i],
                        'weight': 42,
                        'msg': Drupal.t('Cod eroare: 05-042 - Cap.1: R.51 > R.52 -> [@CAP1_R51] > [@CAP1_R52]', { '@CAP1_R51': CAP1_R51, '@CAP1_R52': CAP1_R52 })
                    });
                }
            }
            // End 05-042


            // Start 05-044
            var SumF1 = CAP1_R30 - CAP1_R31;
            if (SumF1 != 0) {
                var calcul5 = ((CAP1_R70 - CAP1_R74) * 1000 / (CAP1_R30 - CAP1_R31)) / 3;
                //calcul5 = parseFloat(calcul5).toFixed(1);
                calcul5 = roundToDecimal(calcul5, 1);
                if (calcul5 <= 4000) {
                    webform.warnings.push({
                        'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                        'weight': 44,
                        'msg': Drupal.t('Cod atenționare: 05-044 - Cap.1: ((R.70 - R.74) * 1000 / (R.30 - R.31)) / 3 > 4000 -> [@sum] > [4000]', { '@sum': calcul5 })
                    });
                }
            }
            // End 05-044

            // Start 05-050
            if ((CAP1_R10 == CAP1_R20) && (CAP1_R10 != 0) && (CAP1_R20 != 0)) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R20_C' + arr_CAP1_inputs_2[i],
                    'weight': 50,
                    'msg': Drupal.t('Cod atenționare: 05-050 - Cap.1: R.10 ≠ R.20, pe fiecare coloană. -> [@CAP1_R10] ≠ [@CAP1_R20]', { '@CAP1_R10': CAP1_R10, '@CAP1_R20': CAP1_R20 })
                });
            }
            // End 05-050

            // Start 05-051
            var sum_CAP1_R71_073_074 = CAP1_R71 + CAP1_R73 + CAP1_R74;
            sum_CAP1_R71_073_074 = roundToDecimal(sum_CAP1_R71_073_074, 1);
            if ((CAP1_R70 == sum_CAP1_R71_073_074) && (CAP1_R70 != 0) && (sum_CAP1_R71_073_074 != 0)) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                    'weight': 51,
                    'msg': Drupal.t('Cod atenționare: 05-051 - Cap.1: R.70 ≠ R.71 + R.73 + R.74 -> [@CAP1_R70] ≠ [@sum_CAP1_R71_073_074]', { '@CAP1_R70': CAP1_R70, '@sum_CAP1_R71_073_074': sum_CAP1_R71_073_074 })
                });
            }
            // End 05-051

            // Start 05-053
            if (CAP1_R200 > CAP1_R10) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R200_C' + arr_CAP1_inputs_2[i],
                    'weight': 53,
                    'msg': Drupal.t('Cod atenționare: 05-053 - Cap.1: R.200 ≤ R.10 -> [@CAP1_R200] ≤ [@CAP1_R10]', { '@CAP1_R200': CAP1_R200, '@CAP1_R10': CAP1_R10 })
                });
            }
            // End 05-053
        }
    }

    // Start 05-052
    if ((values.CAP1_R10_C1 > 0 && values.CAP1_R200_C1 < 0) || (values.CAP1_R10_C1 > 0 && values.CAP1_R200_C1 == '')) {
        webform.errors.push({
            'fieldName': 'CAP1_R200_C1',
            'weight': 52,
            'msg': Drupal.t('Cod atenționare: 05-052 - Cap.1: R.200 ≥ 0 – asigurați-vă că nu aveți locuri vacante (dacă nu, atunci 0). -> [@CAP1_R200_C1] ≥ [0]', { '@CAP1_R200_C1': values.CAP1_R200_C1 })
        });
    }
    // End 05-052

    // Start 05-015 \ 05-024
    for (var k = 2; k < 13; k++) {
        var fields_CAP1_CAEM1 = m1-newGetHeaderSelectValue('#CAP1', k);
        var select_normal_caem = function () {
            if (
                (fields_CAP1_CAEM1.substring(0, 3) == 'Q86') ||
                (fields_CAP1_CAEM1.substring(0, 3) == 'Q87') ||
                (fields_CAP1_CAEM1.substring(0, 5) == 'P8510') ||
                (fields_CAP1_CAEM1.substring(0, 5) == 'P8520') ||
                (fields_CAP1_CAEM1.substring(0, 5) == 'P8531') ||
                (fields_CAP1_CAEM1.substring(0, 5) == 'P8532') ||
                (fields_CAP1_CAEM1.substring(0, 5) == 'P8541') ||
                (fields_CAP1_CAEM1.substring(0, 5) == 'P8542') ||
                (fields_CAP1_CAEM1.substring(0, 5) == 'P8551') ||
                (fields_CAP1_CAEM1.substring(0, 5) == 'P8552')
            ) {
                return true;
            } else {
                return false;
            }
        }();

        // Start 05-015
        if ((fields_CAP1_CAEM1 !== '' && k > 2) || (fields_CAP1_CAEM1 !== '' && k == 2)) {
            if (values['CAP1_R31_C' + k] == '' && select_normal_caem) {
                warnings_push_r31c_015_secondary(k);
            } else if (values['CAP1_R31_C' + k] != '') {
                field_r31_full_error_015(k);
            }
            if (values['CAP1_R74_C' + k] == '' && select_normal_caem) {
                warnings_push_r74c_015_secondary(k);
            } else if (values['CAP1_R74_C' + k] != '') {
                field_r74_full_error_015(k);
            }
        }
        function field_r31_full_error_015(k) {
            if ((fields_CAP1_CAEM1.substring(0, 4) == 'P856') || (fields_CAP1_CAEM1.substring(0, 5) == 'P8553') || (fields_CAP1_CAEM1.substring(0, 5) == 'P8559')) {
                warnings_push_r31c_015_secondary(k);
            } else if (select_normal_caem) {

            } else {
                warnings_push_r31c_015_secondary(k);
            }
        }
        function field_r74_full_error_015(k) {
            if ((fields_CAP1_CAEM1.substring(0, 4) == 'P856') || (fields_CAP1_CAEM1.substring(0, 5) == 'P8553') || (fields_CAP1_CAEM1.substring(0, 5) == 'P8559')) {
                warnings_push_r74c_015_secondary(k);
            } else if (select_normal_caem) {

            } else {
                warnings_push_r74c_015_secondary(k);
            }
        }
        function warnings_push_r31c_015_secondary(k) {
            webform.warnings.push({
                'fieldName': 'CAP1_R31_C' + k,
                'weight': 15,
                'msg': Drupal.t('Cod atenționare: 05-015 - Cap.1: R.31 se introduce, dacă Activitatea CAEM = {Q86,Q87,P85}, excepție  P856, P8553 și P8559, Col.2-12')
            });
        }
        function warnings_push_r74c_015_secondary(k) {
            webform.warnings.push({
                'fieldName': 'CAP1_R74_C' + k,
                'weight': 15,
                'msg': Drupal.t('Cod atenționare: 05-015 - Cap.1: R.74 se introduce, dacă Activitatea CAEM = {Q86,Q87,P85}, excepție  P856, P8553 și P8559, Col.2-12')
            });
        }
        // End 05-015
    }

    // Start 05-031 - Validarea codurilor CAEM pentru duplicate
    var trimValue = m1-newGetElementValue('select[name="TRIM"]');  // Obținem valoarea curentă a TRIM

    // Începem validarea pentru CAP1, care se verifică în orice TRIM
    for (var h = 2; h < 13; h++) {
        var fields_CAP1_CAEM3 = m1-newGetHeaderSelectValue('#CAP1', h);

        // Verificăm dacă valoarea nu este goală înainte de comparare
        if (fields_CAP1_CAEM3 !== '') {
            for (var m = 2; m < 13; m++) {
                if (h != m) {
                    var fields_CAP1_CAEM4 = m1-newGetHeaderSelectValue('#CAP1', m);

                    // Validăm doar dacă ambele valori nu sunt goale și sunt egale
                    if (fields_CAP1_CAEM4 == fields_CAP1_CAEM3 && fields_CAP1_CAEM4 !== '') {
                        webform.errors.push({
                            'fieldName': 'CAP1_CAEM_C' + m,
                            'weight': 31,
                            'msg': Drupal.t('Cod eroare: 05-031 - Cod CAEM nu trebuie să se repete.')
                        });
                    }
                }
            }
        }
    }

    // Dacă TRIM este 3, verificăm și capitolul CAP2
    if (trimValue == 3) {
        for (var h = 2; h < 13; h++) {
            var fields_CAP2_CAEM2 = m1-newGetHeaderSelectValue('#CAP2', h);

            // Verificăm dacă valoarea nu este goală înainte de comparare
            if (fields_CAP2_CAEM2 !== '') {
                for (var m = 2; m < 13; m++) {
                    if (h != m) {
                        var fields_CAP2_CAEM3 = m1-newGetHeaderSelectValue('#CAP2', m);

                        // Validăm doar dacă ambele valori nu sunt goale și sunt egale
                        if (fields_CAP2_CAEM3 == fields_CAP2_CAEM2 && fields_CAP2_CAEM3 !== '') {
                            webform.errors.push({
                                'fieldName': 'CAP2_CAEM_C' + m,
                                'weight': 31,
                                'msg': Drupal.t('Cod eroare: 05-031 - Cod CAEM nu trebuie să se repete.')
                            });
                        }
                    }
                }
            }
        }
    }
    // End 05-031

    //Start 05-002

    // // Logica de validare pentru Capitolul 1
    for (var i = 10; i <= 74; i += 10) {  // Ajustează intervalul de rânduri pentru Capitolul 1
        let col1Value = parseFloat(values["CAP1_R" + i + "_C1"]);
        let colSum = 0;

        // Verificăm dacă col1Value este un număr valid; dacă este NaN, atribuim 0
        if (isNaN(col1Value)) {
            col1Value = 0;
        }

        // Sumăm valorile de la Coloana 2 până la Coloana 12
        for (let col = 2; col <= 12; col++) {
            let colValue = parseFloat(values["CAP1_R" + i + "_C" + col]);
            if (isNaN(colValue)) {
                colValue = 0;
            }
            colSum += colValue;
        }

        // Rotunjim suma la 1 zecimală, dacă este necesar
        colSum = roundToDecimal(colSum, 1);

        // Validăm dacă Coloana 1 este egală cu suma Coloanelor 2-12
        if (col1Value !== colSum) {
            webform.errors.push({
                'fieldName': 'CAP1_R' + i + '_C1',
                'weight': 1,
                'msg': Drupal.t('Cod eroare: 05-002 - Col.1 trebuie să fie egală cu suma Col.2-12 pentru rândul @row. Valoarea Col.1: [@col1], Suma Col.2-12: [@colSum]',
                    {
                        '@row': i,
                        '@col1': col1Value,
                        '@colSum': colSum
                    })
            });
        }
    }

    // 05-002

    //05-003

    // // Rânduri specifice pentru Capitolul 1 care nu se împart la 10
    const specialRowsCap1 = [31, 51, 52, 71, 72, 73, 74];

    specialRowsCap1.forEach(function (row) {
        // Validare pentru Capitolul 1
        let col1ValueCap1 = parseFloat(values["CAP1_R" + row + "_C1"]);
        let colSumCap1 = 0;

        // Verificăm dacă col1ValueCap1 este un număr valid, atribuim 0 dacă este NaN
        if (isNaN(col1ValueCap1)) {
            col1ValueCap1 = 0;
        }

        // Sumăm valorile de la Coloana 2 până la Coloana 12 pentru Capitolul 1
        for (let col = 2; col <= 12; col++) {
            let colValue = parseFloat(values["CAP1_R" + row + "_C" + col]);
            if (isNaN(colValue)) {
                colValue = 0;
            }
            colSumCap1 += colValue;
        }

        colSumCap1 = roundToDecimal(colSumCap1, 1);

        // Validăm dacă Coloana 1 este egală cu suma Coloanelor 2-12 pentru Capitolul 1
        if (col1ValueCap1 !== colSumCap1) {
            webform.errors.push({
                'fieldName': 'CAP1_R' + row + '_C1',
                'weight': 1,
                'msg': Drupal.t('Cod eroare: 05-003 - Capitolul 1: Col.1 trebuie să fie egală cu suma Col.2-12 pentru rândul @row. Valoarea Col.1: [@col1], Suma Col.2-12: [@colSum]',
                    {
                        '@row': row,
                        '@col1': col1ValueCap1,
                        '@colSum': colSumCap1
                    })
            });
        }
    });

    //05-003

    var TRIM = 0;
    if (!isNaN(Number(values['TRIM']))) {
        TRIM = Number(values['TRIM']);
    }
    if (TRIM == 3) {
        // Start Cap.2

        //Start 05-001

        // // Se modifică acest interval pentru a include rândurile corecte
        for (var i = 10; i <= 160; i += 10) {
            let col1Value = parseFloat(values["CAP2_R" + i + "_C1"]);
            let colSum = 0;

            // Asigurăm că col1Value este un număr valid, atribuim 0 dacă este NaN
            if (isNaN(col1Value)) {
                col1Value = 0;  // Atribuim 0 dacă col1Value este NaN
            }

            // Sumăm coloanele 2 până la 12 pentru rândul curent cu verificare NaN
            for (let col = 2; col <= 12; col++) {
                let colValue = parseFloat(values["CAP2_R" + i + "_C" + col]);
                if (isNaN(colValue)) {
                    colValue = 0;  // Atribuim 0 dacă colValue este NaN
                }
                colSum += colValue;  // Adăugăm valoarea fiecărei coloane
            }

            // Rotunjim suma la 1 zecimală, dacă este necesar
            colSum = roundToDecimal(colSum, 1);

            // Dacă Col.1 nu este egală cu suma Col.2-12, adăugăm o eroare
            if (col1Value !== colSum) {
                webform.errors.push({
                    'fieldName': 'CAP2_R' + i + '_C1',
                    'weight': 1,
                    'msg': Drupal.t('Cod eroare: 05-001 - Col.2 trebuie să fie egală cu suma Col.2-12 pentru rândul @row. Valoarea curentă Col.1: [@col1], Suma Col.2-12: [@colSum]',
                        {
                            '@row': i,
                            '@col1': col1Value,
                            '@colSum': colSum
                        })
                });
            }
        }

        // End 05-001

        // Start 05-021 \ 07-00(7, 9, 16, 18)
        var arr_CAP2_inputs_1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        var arr_CAP2_L = ['10', '20', '30', '40', '60', '70', '80', '90', '100', '110'];
        var valid_ = 0;
        for (var j = 0; j < arr_CAP2_inputs_1.length; j++) {
            for (var l = 0; l < arr_CAP2_L.length; l++) {
                if (!isNaN(parseFloat(values['CAP2_R' + arr_CAP2_L[l] + '_C' + arr_CAP2_inputs_1[j]]))) {
                    valid_ = 1;
                } else if (!isNaN(parseFloat(values['CAP2_R' + arr_CAP2_L[l] + '_C' + arr_CAP2_inputs_1[j]]))) {
                    valid_ = 1;
                }
            }
        }
        if (valid_ == 1) {
            var arr_CAP2_inputs_2 = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
            for (var i = 0; i < arr_CAP2_inputs_2.length; i++) {

                // Start 05-021
                var fields_CAP2_CAEM1 = m1-newGetHeaderSelectValue('#CAP2', arr_CAP2_inputs_2[i]);
                var CAP2_R10 = 0;
                if (!isNaN(parseFloat(values['CAP2_R10_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R10 = parseFloat(values['CAP2_R10_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R10_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R20 = 0;
                if (!isNaN(parseFloat(values['CAP2_R20_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R20 = parseFloat(values['CAP2_R20_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R20_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R30 = 0;
                if (!isNaN(parseFloat(values['CAP2_R30_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R30 = parseFloat(values['CAP2_R30_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R30_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R40 = 0;
                if (!isNaN(parseFloat(values['CAP2_R40_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R40 = parseFloat(values['CAP2_R40_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R40_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R50 = 0;
                if (!isNaN(parseFloat(values['CAP2_R50_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R50 = parseFloat(values['CAP2_R50_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R50_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R60 = 0;
                if (!isNaN(parseFloat(values['CAP2_R60_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R60 = parseFloat(values['CAP2_R60_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R60_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R70 = 0;
                if (!isNaN(parseFloat(values['CAP2_R70_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R70 = parseFloat(values['CAP2_R70_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R70_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R80 = 0;
                if (!isNaN(parseFloat(values['CAP2_R80_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R80 = parseFloat(values['CAP2_R80_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R80_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R90 = 0;
                if (!isNaN(parseFloat(values['CAP2_R90_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R90 = parseFloat(values['CAP2_R90_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R90_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R100 = 0;
                if (!isNaN(parseFloat(values['CAP2_R100_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R100 = parseFloat(values['CAP2_R100_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R100_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R110 = 0;
                if (!isNaN(parseFloat(values['CAP2_R110_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R110 = parseFloat(values['CAP2_R110_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R110_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R120 = 0;
                if (!isNaN(parseFloat(values['CAP2_R120_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R120 = parseFloat(values['CAP2_R120_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R120_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }
                var CAP2_R160 = 0;
                if (!isNaN(parseFloat(values['CAP2_R160_C' + arr_CAP2_inputs_2[i]]))) {
                    CAP2_R160 = parseFloat(values['CAP2_R160_C' + arr_CAP2_inputs_2[i]]);
                    if (fields_CAP2_CAEM1 == '') {
                        webform.errors.push({
                            'fieldName': 'CAP2_R160_C' + arr_CAP2_inputs_2[i],
                            'weight': 21,
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloană cu date există cod CAEM, Cap.1-2')
                        });
                    }
                }


                // Start 07-007
                var sum_CAP_R020_110 =
                    CAP2_R20 +
                    CAP2_R30 +
                    CAP2_R40 +
                    CAP2_R50 +
                    CAP2_R60 +
                    CAP2_R70 +
                    CAP2_R80 +
                    CAP2_R90 +
                    CAP2_R100 +
                    CAP2_R110;

                sum_CAP_R020_110 = roundToDecimal(sum_CAP_R020_110, 1);

                if (CAP2_R10 !== sum_CAP_R020_110) {
                    webform.errors.push({
                        'fieldName': 'CAP2_R10_C' + arr_CAP2_inputs_2[i],
                        'weight': 7,
                        'msg': Drupal.t(
                            'Cod eroare: 07-007 - Cap.2: SUM(R.20, ..., R.110) = R.10, pe toate coloanele. -> [@sum_CAP_R020_110] = [@CAP2_R10]',
                            {
                                '@sum_CAP_R020_110': sum_CAP_R020_110,
                                '@CAP2_R10': CAP2_R10
                            }
                        )
                    });
                }
                // End 07-007

                // Start 07-009

                // Start 07-009
                if (CAP2_R10 > 0) {

                    var min_CAP2_R160 = (
                        0 * CAP2_R20 +
                        6300.01 * CAP2_R30 +
                        6300.01 * CAP2_R40 +
                        7000.01 * CAP2_R50 +
                        8000.01 * CAP2_R60 +
                        10000.01 * CAP2_R70 +
                        15000.01 * CAP2_R80 +
                        20000.01 * CAP2_R90 +
                        25000.01 * CAP2_R100 +
                        30000.01 * CAP2_R110
                    ) / 1000;

                    var max_CAP2_R160 = (
                        6300 * CAP2_R20 +
                        6300 * CAP2_R30 +
                        7000 * CAP2_R40 +
                        8000 * CAP2_R50 +
                        10000 * CAP2_R60 +
                        15000 * CAP2_R70 +
                        20000 * CAP2_R80 +
                        25000 * CAP2_R90 +
                        30000 * CAP2_R100 +
                        40000 * CAP2_R110
                    ) / 1000;

                    var rounded_CAP2_R160 = roundToDecimal(CAP2_R160, 1);
                    min_CAP2_R160 = roundToDecimal(min_CAP2_R160, 1);
                    max_CAP2_R160 = roundToDecimal(max_CAP2_R160, 1);

                    if (
                        rounded_CAP2_R160 < min_CAP2_R160 ||
                        rounded_CAP2_R160 > max_CAP2_R160
                    ) {
                        webform.warnings.push({
                            'fieldName': 'CAP2_R160_C' + arr_CAP2_inputs_2[i],
                            'weight': 9,
                            'msg': Drupal.t(
                                'Cod atenționare: 07-009 - Cap.2: Verificarea la minimum și maximum. -> Col.[@col] ([@CAP2_R160] mii lei) nu aparține intervalului [@min_CAP2_R160 - @max_CAP2_R160]',
                                {
                                    '@col': arr_CAP2_inputs_2[i],
                                    '@CAP2_R160': rounded_CAP2_R160,
                                    '@min_CAP2_R160': min_CAP2_R160,
                                    '@max_CAP2_R160': max_CAP2_R160
                                }
                            )
                        });
                    }
                }
                // End 07-009
                // End 07-009


                // Start 07-016
                // Cap.2: Verificarea la maximum dacă lipsește R.110

                if (CAP2_R10 > 0) {

                    var max_CAP2_R160_016 = (
                        6300 * CAP2_R20 +
                        6300 * CAP2_R30 +
                        7000 * CAP2_R40 +
                        8000 * CAP2_R50 +
                        10000 * CAP2_R60 +
                        15000 * CAP2_R70 +
                        20000 * CAP2_R80 +
                        25000 * CAP2_R90 +
                        30000 * CAP2_R100 +
                        40000 * CAP2_R110
                    ) / 1000;

                    var rounded_CAP2_R160_016 =
                        roundToDecimal(CAP2_R160, 1);

                    max_CAP2_R160_016 =
                        roundToDecimal(max_CAP2_R160_016, 1);

                    if (
                        CAP2_R110 === 0 &&
                        rounded_CAP2_R160_016 > max_CAP2_R160_016
                    ) {
                        webform.errors.push({
                            'fieldName':
                                'CAP2_R160_C' + arr_CAP2_inputs_2[i],

                            'weight': 16,

                            'msg': Drupal.t(
                                'Cod eroare: 07-016 - Cap.2: Verificarea la maximum dacă lipsește R.110. -> Col.[@col] R.160 = [@CAP2_R160] depășește maximul [@max_CAP2_R160]',
                                {
                                    '@col': arr_CAP2_inputs_2[i],
                                    '@CAP2_R160': rounded_CAP2_R160_016,
                                    '@max_CAP2_R160': max_CAP2_R160_016
                                }
                            )
                        });
                    }
                }

                // End 07-016



                // Start 07-018
                if (CAP2_R20 > 0) {
                    webform.warnings.push({
                        'fieldName': 'CAP2_R10_C' + arr_CAP2_inputs_2[i],
                        'weight': 18,
                        'msg': Drupal.t('Cod atenționare: 07-018 - Cap.2: Asigurați-vă de corectitudinea datelor. Salariul minim = 6300 lei. -> [@CAP2_R20]', { '@CAP2_R20': CAP2_R20 })
                    });
                }
                // End 07-018
            }
        }
        // End 05-021 \ 07-00(7, 9, 16, 18)
        // End Cap.2

        // Start Cap.1-2
        // Start 07-00(6, 15, 17)
        var arr_CAP1_2_inputs_1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        for (var i = 0; i < arr_CAP1_2_inputs_1.length; i++) {

            // Start 07-006
            var CAP1_R30 = 0;
            if (!isNaN(parseFloat(values['CAP1_R30_C' + arr_CAP1_2_inputs_1[i]]))) {
                CAP1_R30 = parseFloat(values['CAP1_R30_C' + arr_CAP1_2_inputs_1[i]]);
            }
            var CAP2_R10 = 0;
            if (!isNaN(parseFloat(values['CAP2_R10_C' + arr_CAP1_2_inputs_1[i]]))) {
                CAP2_R10 = parseFloat(values['CAP2_R10_C' + arr_CAP1_2_inputs_1[i]]);
            }
            if (CAP1_R30 < CAP2_R10) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_2_inputs_1[i],
                    'weight': 6,
                    'msg': Drupal.t('Cod atenționare: 07-006 - Cap.2: R.10 ≤ Cap.1 R.30, pe toate coloanele. -> [@CAP2_R10] ≤ [@CAP1_R30]', { '@CAP2_R10': CAP2_R10, '@CAP1_R30': CAP1_R30 })
                });
            }
            // End 07-006

            // Start 07-015
            var CAP1_R70 = 0;
            if (!isNaN(parseFloat(values['CAP1_R70_C' + arr_CAP1_2_inputs_1[i]]))) {
                CAP1_R70 = parseFloat(values['CAP1_R70_C' + arr_CAP1_2_inputs_1[i]]);
            }
            var CAP1_R73 = 0;
            if (!isNaN(parseFloat(values['CAP1_R73_C' + arr_CAP1_2_inputs_1[i]]))) {
                CAP1_R73 = parseFloat(values['CAP1_R73_C' + arr_CAP1_2_inputs_1[i]]);
            }
            var CAP2_R160 = 0;
            if (!isNaN(parseFloat(values['CAP2_R160_C' + arr_CAP1_2_inputs_1[i]]))) {
                CAP2_R160 = parseFloat(values['CAP2_R160_C' + arr_CAP1_2_inputs_1[i]]);
            }
            if (CAP1_R73 > 0) {
                var calcul6 = ((CAP1_R70) - (CAP1_R73)) / 3;
                //calcul6 = parseFloat(calcul6).toFixed(1);
                calcul6 = roundToDecimal(calcul6, 1);
                if (CAP2_R160 > calcul6) {
                    webform.warnings.push({
                        'fieldName': 'CAP2_R160_C' + arr_CAP1_2_inputs_1[i],
                        'weight': 15,
                        'msg': Drupal.t('Cod atenționare: 07-015 - Cap.2: R.160 ≤ R.70 - R.73 / 3 Cap.1 pe toate coloanele. -> [@CAP2_R160] ≤ [@calcul6]', { '@CAP2_R160': CAP2_R160, '@calcul6': calcul6 })
                    });
                }
            }
            // End 07-015

            // Start 07-017
            var CAP1_R10 = 0;
            if (!isNaN(parseFloat(values['CAP1_R10_C' + arr_CAP1_2_inputs_1[i]]))) {
                CAP1_R10 = parseFloat(values['CAP1_R10_C' + arr_CAP1_2_inputs_1[i]]);
            }
            var CAP2_R10 = 0;
            if (!isNaN(parseFloat(values['CAP2_R10_C' + arr_CAP1_2_inputs_1[i]]))) {
                CAP2_R10 = parseFloat(values['CAP2_R10_C' + arr_CAP1_2_inputs_1[i]]);
            }
            if (CAP1_R10 > 0) {
                var calcul7 = (CAP1_R30 * 100) / CAP1_R10;
                //calcul7 = parseFloat(calcul7).toFixed(1);
                calcul7 = roundToDecimal(calcul7, 1);
                if (calcul7 >= 70 && CAP2_R10 == 0) {
                    webform.warnings.push({
                        'fieldName': 'CAP2_R10_C' + arr_CAP1_2_inputs_1[i],
                        'weight': 17,
                        'msg': Drupal.t('Cod atenționare: 07-017 - Dacă Cap.1 R.30 * 100 / R.10 ≥ 70%, în Cap.2 ar trebui să existe R.10, pe toate coloanele. -> [@calcul7]% ≥ [70]%', { '@calcul7': calcul7 })
                    });
                }
            }
            // End 07-017
        }
        // End 07-00(6, 15, 17)

        // Start 07-010
        for (var h = 2; h < 13; h++) {
            var fields_CAP1_CAEM5 = m1-newGetHeaderSelectValue('#CAP1', h);
            var fields_CAP2_CAEM4 = m1-newGetHeaderSelectValue('#CAP2', h);
            if ((fields_CAP1_CAEM5 !== fields_CAP2_CAEM4) || ((fields_CAP1_CAEM5 !== '') && (fields_CAP2_CAEM4 == ''))) {
                webform.errors.push({
                    'fieldName': 'CAP2_CAEM_C' + h,
                    'weight': 10,
                    'msg': Drupal.t('Cod eroare: 07-010 - Cod CAEM din Cap.2 trebuie să coincidă cu cod CAEM din Cap.1')
                });
            }
        }
        // End 07-010


        // Start 07-023

        var CAP1_R120_C1 = 0;
        if (!isNaN(parseFloat(values['CAP1_R120_C1']))) {
            CAP1_R120_C1 = parseFloat(values['CAP1_R120_C1']);
        }

        var CAP2_R10_C1 = 0;
        if (!isNaN(parseFloat(values['CAP2_R10_C1']))) {
            CAP2_R10_C1 = parseFloat(values['CAP2_R10_C1']);
        }

        var CAP2_R160_C1 = 0;
        if (!isNaN(parseFloat(values['CAP2_R160_C1']))) {
            CAP2_R160_C1 = parseFloat(values['CAP2_R160_C1']);
        }

        /*
         * Validarea se execută numai dacă ambii divizori au valori mai mari ca zero.
         * În caz contrar, formula nu poate fi calculată corect.
         */
        if (CAP2_R10_C1 > 0 && CAP1_R120_C1 > 0) {

            var calcul8 =
                ((CAP2_R160_C1 * 1000) / CAP2_R10_C1) /
                CAP1_R120_C1 *
                100;

            calcul8 = roundToDecimal(calcul8, 1);

            if (isFinite(calcul8) && (calcul8 < 85 || calcul8 > 130)) {
                webform.warnings.push({
                    'fieldName': 'CAP2_R160_C1',
                    'weight': 23,
                    'msg': Drupal.t(
                        'Cod atenționare: 07-023 - (Cap.2 R.160 Col.1 * 1000 / R.10 Col.1) / Cap.1 R.120 Col.1 * 100 = [85-130]% -> [@calcul8]%',
                        {
                            '@calcul8': calcul8
                        }
                    )
                });
            }
        }

        // End 07-023

        //Modify here as well

        // Start 07-024
        var CAP1_R30_C1 = 0;
        if (!isNaN(parseFloat(values['CAP1_R30_C1']))) {
            CAP1_R30_C1 = parseFloat(values['CAP1_R30_C1']);
        }
        var CAP1_R70_C1 = 0;
        if (!isNaN(parseFloat(values['CAP1_R70_C1']))) {
            CAP1_R70_C1 = parseFloat(values['CAP1_R70_C1']);
        }
        var CAP1_R73_C1 = 0;
        if (!isNaN(parseFloat(values['CAP1_R73_C1']))) {
            CAP1_R73_C1 = parseFloat(values['CAP1_R73_C1']);
        }
        var SumF2 = CAP1_R70_C1 - CAP1_R73_C1;
        var SumF3 = CAP1_R30_C1 - CAP2_R10_C1;
        if ((SumF2 != 0) && (SumF3 != 0)) {

            //var calcul9 = (SumF2 / 3 - CAP2_R160_C1) * 1000 / SumF3;

            var calcul9 = safeDivide(SumF2 / 3 - CAP2_R160_C1, SumF3) * 1000;
            //calcul9 = parseFloat(calcul9).toFixed(1);
            calcul9 = roundToDecimal(calcul9, 1);
            if (calcul9 <= 3000) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R70_C1',
                    'weight': 24,
                    'msg': Drupal.t('Cod atenționare: 07-024 - (Cap.1 Col.1 (R.70 - R.73) / 3 - Cap.2 R.160 Col.1) * 1000 / (Cap.1 R.30 Col.1 - Cap.2 R.10 Col.1) > 3000 -> [@calcul9] > [3000]', { '@calcul9': calcul9 })
                });
            }
        }
        // End 07-024

        // End Cap.1-2
    }

    //Sort warnings & errors
    webform.warnings.sort(function (a, b) {
        return sort_errors_warinings(a, b);
    });

    webform.errors.sort(function (a, b) {
        return sort_errors_warinings(a, b);
    });

    webform.validatorsStatus['m1-new'] = 1;
    validateWebform();
}

function validateCap2SumAndTrim(values) {
    // Preluăm valoarea TRIM
    var trimValue = 0;
    if (!isNaN(Number(values['TRIM']))) {
        trimValue = Number(values['TRIM']);
    }

    // Definim câmpurile din Capitolul II
    var fields = [
        'CAP2_R10_', 'CAP2_R20_', 'CAP2_R30_', 'CAP2_R40_', 'CAP2_R50_',
        'CAP2_R60_', 'CAP2_R70_', 'CAP2_R80_', 'CAP2_R90_', 'CAP2_R100_',
        'CAP2_R110_', 'CAP2_R120_', 'CAP2_R160_'
    ];

    // Variabilă pentru a aduna valorile și pentru a colecta câmpurile cu date
    var cap2Sum = 0;
    var errors = [];

    // Iterăm prin toate rândurile și coloanele din Cap2 pentru a aduna valorile și a colecta câmpurile care au date
    for (var i = 0; i < fields.length; i++) {
        for (var j = 1; j <= 12; j++) {
            var fieldName = fields[i] + 'C' + j;
            var cellValue = parseFloat(values[fieldName]);
            if (!isNaN(cellValue) && cellValue > 0) {
                cap2Sum += cellValue;

                // Adaugă eroare pentru fiecare câmp specific dacă TRIM nu este 3
                if (trimValue != 3) {
                    errors.push({
                        'fieldName': fieldName,
                        'weight': 1,
                        'msg': Drupal.t('Eroare: Capitolul II conține date în câmpul [@fieldName] (valoare: @cellValue), dar TRIM nu este egal cu 3. Vă rugăm să corectați.', {
                            '@fieldName': fieldName,
                            '@cellValue': cellValue
                        })
                    });
                }
            }
        }
    }

    // Returnăm toate erorile dacă există
    if (errors.length > 0) {
        return errors;
    }

    return null; // Nicio eroare
}

function validateCAEM2(values) {
    // Preluăm valoarea TRIM
    var trimValue = 0;
    if (!isNaN(Number(values['TRIM']))) {
        trimValue = Number(values['TRIM']);
    }

    var caemFields = [
        'CAP2_CAEM_C2', 'CAP2_CAEM_C3', 'CAP2_CAEM_C4', 'CAP2_CAEM_C5',
        'CAP2_CAEM_C6', 'CAP2_CAEM_C7', 'CAP2_CAEM_C8', 'CAP2_CAEM_C9',
        'CAP2_CAEM_C10', 'CAP2_CAEM_C11', 'CAP2_CAEM_C12'
    ];

    var caem2HasData = false;
    var errors = [];

    // Iterăm prin câmpurile CAEM pentru a verifica dacă sunt completate
    for (var i = 0; i < caemFields.length; i++) {
        var caemField = values[caemFields[i]]; // CAEM specific coloanei

        // Verificăm dacă CAEM este completat
        if (caemField && caemField !== '') {
            caem2HasData = true;

            // Dacă TRIM nu este 3 și CAEM este completat, afișăm eroare
            if (trimValue != 3) {
                errors.push({
                    'fieldName': caemFields[i],
                    'weight': 1,
                    'msg': Drupal.t('Eroare: Câmpul [@fieldName] (genul de activitate) este completat, dar TRIM nu este egal cu 3. Vă rugăm să corectați.', {
                        '@fieldName': caemFields[i]
                    })
                });
            }
        }
    }

    // Returnăm erorile, dacă există
    if (errors.length > 0) {
        return errors;
    }

    return null; // Nicio eroare
}

function validateCAEM_COL1_CAP1(values) {
    // Initialize the values object if undefined
    if (typeof values === 'undefined') {
        values = {};
    }

    // Use the Select2 API to retrieve the selected CAEM value from the main field
    var caem = m1-newGetElementValue('#CAEM');  // Get CAEM from the main activity
    var cap1_caem_c2_value = m1-newGetElementValue('#CAP1_CAEM_C2');  // Get the value from the second field (Col 2)

    console.log('Main CAEM value:', caem);
    console.log('CAP1 CAEM C2 value:', cap1_caem_c2_value);

    // Handle case when fields_CAP1_CAEM2 (second column) is undefined or empty
    if (typeof cap1_caem_c2_value === 'undefined' || cap1_caem_c2_value === null || cap1_caem_c2_value === '') {
        // Optionally add an error for undefined or empty values
        webform.errors.push({
            'fieldName': 'CAP1_CAEM_C2',
            'msg': Drupal.t('Cod eroare: A.015 Trebuie selectat un cod CAEM pentru coloana 2.')
        });
        return; // Exit the function early since no valid CAEM is selected in column 2
    }

    // Check if the CAEM value from the main activity matches the second field
    if (caem !== cap1_caem_c2_value) {
        // Push error if CAEM does not match
        webform.errors.push({
            'fieldName': 'CAP1_CAEM_C2',
            'msg': Drupal.t(`Cod eroare: A.014 Cod CAEM (${caem}) trebuie sa fie acelasi ca si in Activitatea principală (${cap1_caem_c2_value})`)
        });
    }
}

// -------------------------

function sort_errors_warinings(a, b) {
    if (!a.hasOwnProperty('weight')) {
        a.error_code = 9999;
    }
    if (!b.hasOwnProperty('weight')) {
        b.error_code = 9999;
    }
    return toFloat(a.error_code) - toFloat(b.error_code);
}