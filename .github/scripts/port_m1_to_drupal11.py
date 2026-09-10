from pathlib import Path
import re
import subprocess
import sys

SOURCE = Path('TRIM_3_2026/M1_12.js')
TARGET = Path('v3_trim_3_2026/M1_0469.js')

NATIVE_HEADER = r'''// M1 - eDec V3 / Drupal 11
// Functional port of TRIM_3_2026/M1_12.js without jQuery.

function m1GetElementValue(selector) {
    var element = document.querySelector(selector);
    return element && element.value != null ? element.value : '';
}

function m1GetHeaderSelectValue(tableSelector, columnNumber) {
    var selector = tableSelector + ' thead tr td:nth-child(' + columnNumber + ') select';
    var element = document.querySelector(selector);
    return element && element.value != null ? element.value : '';
}

(function (Drupal, drupalSettings) {
    'use strict';

    Drupal.behaviors.m1 = {
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
                return Number(m1GetElementValue('select[name="TRIM"]'));
            }

            function fillMainCaemFieldsM1() {
                var caem = m1GetElementValue('#CAEM') || '';
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
                var caem = m1GetElementValue('#' + sourceFieldName) || '';

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
                    .querySelectorAll('.m1-caem-duplicate-message-' + chapterPrefix)
                    .forEach(function (message) {
                        message.remove();
                    });

                document
                    .querySelectorAll('select[name^="' + chapterPrefix + '_CAEM_C"]')
                    .forEach(function (field) {
                        field.classList.remove('m1-caem-duplicate-field');

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

                field.classList.add('m1-caem-duplicate-field');

                var visualElement = getVisibleSelectElement(field);
                if (visualElement) {
                    visualElement.style.border = '1px solid #b94a48';
                    visualElement.style.boxShadow = '0 0 3px rgba(185, 74, 72, 0.5)';
                }

                var message = document.createElement('div');
                message.className = 'm1-caem-duplicate-message-' + chapterPrefix;
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
                    var caem = m1GetElementValue(
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

            if (!form.dataset.m1NativeEventsBound) {
                form.dataset.m1NativeEventsBound = '1';

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

            var initialTrimValue = m1GetElementValue('select[name="TRIM"]');
            toggleCap2(initialTrimValue);
            fillMainCaemFieldsM1();

            if (Number(initialTrimValue) === 3) {
                syncAllCap1CaemToCap2();
            }

            validateAllCaemDuplicatesInline();
        }
    };
})(Drupal, drupalSettings);

'''


def replace_validator_jquery(text: str) -> str:
    replacements = {
        "jQuery('#CAP1 thead tr td:nth-child(' + arr_CAP1_inputs_2[i] + ')').find('select').val()": "m1GetHeaderSelectValue('#CAP1', arr_CAP1_inputs_2[i])",
        "jQuery('#CAP1 thead tr td:nth-child(' + k + ')').find('select').val()": "m1GetHeaderSelectValue('#CAP1', k)",
        "jQuery('#CAP1 thead tr td:nth-child(' + h + ')').find('select').val()": "m1GetHeaderSelectValue('#CAP1', h)",
        "jQuery('#CAP1 thead tr td:nth-child(' + m + ')').find('select').val()": "m1GetHeaderSelectValue('#CAP1', m)",
        "jQuery('#CAP2 thead tr td:nth-child(' + h + ')').find('select').val()": "m1GetHeaderSelectValue('#CAP2', h)",
        "jQuery('#CAP2 thead tr td:nth-child(' + m + ')').find('select').val()": "m1GetHeaderSelectValue('#CAP2', m)",
        "jQuery('#CAP2 thead tr td:nth-child(' + arr_CAP2_inputs_2[i] + ')').find('select').val()": "m1GetHeaderSelectValue('#CAP2', arr_CAP2_inputs_2[i])",
        "jQuery('select[name=\"TRIM\"]').val()": "m1GetElementValue('select[name=\"TRIM\"]')",
        "jQuery('#CAEM').select2('val')": "m1GetElementValue('#CAEM')",
        "jQuery('#CAP1_CAEM_C2').select2('val')": "m1GetElementValue('#CAP1_CAEM_C2')",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text


def active_occurrences(text: str, needle: str):
    result = []
    in_block_comment = False

    for line_number, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()

        if in_block_comment:
            if '*/' in stripped:
                in_block_comment = False
            continue

        if stripped.startswith('/*'):
            if '*/' not in stripped:
                in_block_comment = True
            continue

        code = line.split('//', 1)[0]
        if needle in code:
            result.append((line_number, line.strip()))

    return result


def main():
    source = SOURCE.read_text(encoding='utf-8')
    marker = 'function validate_76_008(values) {'

    if marker not in source:
        raise RuntimeError(f'Cannot find validator marker: {marker}')

    validators = source[source.index(marker):]
    validators = validators.replace('Drupal.settings', 'drupalSettings')
    validators = replace_validator_jquery(validators)

    output = NATIVE_HEADER + validators

    active_jquery = active_occurrences(output, 'jQuery')
    if active_jquery:
        print('Active jQuery references remain:')
        for item in active_jquery:
            print(item)
        raise RuntimeError('Drupal 11 target still contains active jQuery references')

    active_old_settings = active_occurrences(output, 'Drupal.settings')
    if active_old_settings:
        print('Active Drupal.settings references remain:')
        for item in active_old_settings:
            print(item)
        raise RuntimeError('Drupal 11 target still contains Drupal.settings references')

    # Protect the functional rules from accidental loss during the port.
    required_tokens = [
        'validate_76_008',
        'validatePhoneNumber',
        'validateCAEM2',
        'validateCap2SumAndTrim',
        'CAP1_CAEM_C2',
        'CAP2_CAEM_C2',
        'Cod eroare:',
        'Cod atenționare:',
    ]

    for token in required_tokens:
        if token not in output:
            raise RuntimeError(f'Missing required functional token: {token}')

    TARGET.write_text(output, encoding='utf-8')

    print(f'Generated {TARGET}: lines={len(output.splitlines())} chars={len(output)}')
    print(f'Active jQuery references: {len(active_occurrences(output, "jQuery"))}')
    print(f'Active Drupal.settings references: {len(active_occurrences(output, "Drupal.settings"))}')
    print(f'drupalSettings references: {output.count("drupalSettings")}')


if __name__ == '__main__':
    main()
