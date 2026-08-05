(function ($) {
    Drupal.behaviors.m1 = {
        
      //--------------------  
        //--------------------
        attach: function (context, settings) {
            var $form = jQuery('#mywebform-edit-form');

            $form.on(
                'mywebform:gridRefreshField',
                'input.dynamic-region',
                function () {
                    var val = jQuery(this).val();

                    if (val !== null && val !== undefined) {
                        var processed_val = String(val).trim();

                        if (val !== processed_val) {
                            jQuery(this)
                                .val(processed_val)
                                .trigger('change');
                        }
                    } else {
                        console.warn(
                            'Input value is null or undefined'
                        );
                    }
                }
            );

            jQuery('#mywebform-edit-form', context).on(
                'keypress',
                'input.numeric, input.money, input.float',
                function (event) {
                    if (isNumberPressed(this, event) === false) {
                        event.preventDefault();
                    }
                }
            );

            jQuery('#mywebform-edit-form', context).on(
                'paste',
                'input.numeric, input.money, input.float',
                function (event) {
                    var obj = event.originalEvent || event;

                    if (
                        typeof obj.clipboardData !== 'undefined'
                    ) {
                        var value = obj.clipboardData
                            .getData('text/plain')
                            .trim();

                        var isNumeric =
                            /^[+-]?\d+(\.\d+)?$/.test(value);

                        var number = isNumeric
                            ? Number(value)
                            : NaN;

                        if (
                            !isNumeric ||
                            isNaN(number) ||
                            is_negative(number)
                        ) {
                            event.preventDefault();

                            console.warn(
                                'Pasted value is not a valid number or is negative:',
                                value
                            );
                        } else {
                            jQuery(this).val(number);
                        }
                    }
                }
            );

            $form.on(
                'mywebform:sync',
                'input',
                function () {
                    var $this = jQuery(this);
                    var fieldName = $this.attr('field');
                }
            );

            $form.on(
                'mywebform:sync',
                'select.Section-caem',
                function () {
                    // fill_section2_caem_fields(jQuery(this));
                }
            );

            // =====================================================
            // Funcții generale pentru Select2 și valorile interne
            // =====================================================

            function setSelect2Value(
                fieldSelector,
                value
            ) {
                var $field = jQuery(fieldSelector);

                if (!$field.length) {
                    return;
                }

                $field
                    .myWebformSelect2SetVal(value)
                    .trigger('change');
            }

            function updateInternalFieldValue(
                fieldName,
                value
            ) {
                if (
                    Drupal.settings &&
                    Drupal.settings.mywebform &&
                    Drupal.settings.mywebform.values
                ) {
                    Drupal.settings.mywebform.values[
                        fieldName
                    ] = value;
                }
            }

            // =====================================================
            // Start sincronizare CAEM din foaia de titlu
            // =====================================================

            function fillMainCaemFieldsM1() {
                var caem = jQuery('#CAEM').val() || '';

                var trimValue = Number(
                    jQuery('select[name="TRIM"]').val()
                );

                // CAEM din foaia de titlu
                // se copiază în Cap.1, col.2.
                setSelect2Value(
                    '#CAP1_CAEM_C2',
                    caem
                );

                updateInternalFieldValue(
                    'CAP1_CAEM_C2',
                    caem
                );

                // Pentru trimestrul III se copiază
                // și în Cap.2, col.2.
                if (trimValue === 3) {
                    setSelect2Value(
                        '#CAP2_CAEM_C2',
                        caem
                    );

                    updateInternalFieldValue(
                        'CAP2_CAEM_C2',
                        caem
                    );
                }
            }

            jQuery('#CAEM').on(
                'mywebform:sync',
                function () {
                    fillMainCaemFieldsM1();
                }
            );

            jQuery('#CAEM')
                .once('m1-main-caem-sync')
                .on(
                    'change select2:select',
                    function () {
                        var caem =
                            jQuery(this).val() || '';

                        updateInternalFieldValue(
                            'CAEM',
                            caem
                        );

                        fillMainCaemFieldsM1();
                    }
                );

            // =====================================================
            // End sincronizare CAEM din foaia de titlu
            // =====================================================


            // =====================================================
            // Start sincronizare CAEM Cap.1 -> Cap.2
            // =====================================================

            function syncCap1CaemToCap2(
                columnNumber
            ) {
                var trimValue = Number(
                    jQuery('select[name="TRIM"]').val()
                );

                // Capitolul II este activ numai în trimestrul III.
                if (trimValue !== 3) {
                    return;
                }

                var sourceFieldName =
                    'CAP1_CAEM_C' + columnNumber;

                var targetFieldName =
                    'CAP2_CAEM_C' + columnNumber;

                var sourceSelector =
                    '#' + sourceFieldName;

                var targetSelector =
                    '#' + targetFieldName;

                var caem =
                    jQuery(sourceSelector).val() || '';

                setSelect2Value(
                    targetSelector,
                    caem
                );

                updateInternalFieldValue(
                    targetFieldName,
                    caem
                );
            }

            function syncAllCap1CaemToCap2() {
                for (
                    var columnNumber = 2;
                    columnNumber <= 12;
                    columnNumber++
                ) {
                    syncCap1CaemToCap2(
                        columnNumber
                    );
                }
            }

            function getCap1CaemColumn($element) {
                var fieldName =
                    $element.attr('name') ||
                    $element.attr('id') ||
                    $element.attr('field') ||
                    '';

                var matches = fieldName.match(
                    /^CAP1_CAEM_C(\d+)$/
                );

                if (!matches) {
                    return null;
                }

                return Number(matches[1]);
            }

            $form
                .once('m1-cap1-cap2-caem-sync')
                .on(
                    'change select2:select select2:unselect',
                    'select[name^="CAP1_CAEM_C"]',
                    function () {
                        var columnNumber =
                            getCap1CaemColumn(
                                jQuery(this)
                            );

                        if (
                            columnNumber !== null &&
                            columnNumber >= 2 &&
                            columnNumber <= 12
                        ) {
                            syncCap1CaemToCap2(
                                columnNumber
                            );
                        }
                    }
                );

            $form.on(
                'mywebform:sync',
                'select[name^="CAP1_CAEM_C"]',
                function () {
                    var columnNumber =
                        getCap1CaemColumn(
                            jQuery(this)
                        );

                    if (
                        columnNumber !== null &&
                        columnNumber >= 2 &&
                        columnNumber <= 12
                    ) {
                        syncCap1CaemToCap2(
                            columnNumber
                        );
                    }
                }
            );

            // =====================================================
            // End sincronizare CAEM Cap.1 -> Cap.2
            // =====================================================


            // =====================================================
            // Start verificare inline CAEM2 duplicate în Cap.1
            // =====================================================

            function removeCap1CaemDuplicateMessages() {
                jQuery(
                    '.m1-caem-duplicate-message'
                ).remove();

                jQuery(
                    'select[name^="CAP1_CAEM_C"]'
                ).removeClass(
                    'm1-caem-duplicate-field'
                );

                jQuery(
                    'select[name^="CAP1_CAEM_C"]'
                )
                    .next('.select2-container')
                    .find('.select2-selection--single')
                    .css({
                        border: '',
                        boxShadow: ''
                    });
            }

            function showCap1CaemDuplicateMessage(
                columnNumber,
                duplicateColumnNumber
            ) {
                var fieldSelector =
                    '#CAP1_CAEM_C' + columnNumber;

                var $field =
                    jQuery(fieldSelector);

                if (!$field.length) {
                    return;
                }

                $field.addClass(
                    'm1-caem-duplicate-field'
                );

                var $select2Container =
                    $field.next('.select2-container');

                if ($select2Container.length) {
                    $select2Container
                        .find(
                            '.select2-selection--single'
                        )
                        .css({
                            border: '1px solid #b94a48',
                            boxShadow:
                                '0 0 3px rgba(185, 74, 72, 0.5)'
                        });
                }

                var message =
                    '<div ' +
                    'class="m1-caem-duplicate-message" ' +
                    'style="' +
                    'color: #b94a48;' +
                    'font-size: 12px;' +
                    'font-weight: bold;' +
                    'line-height: 1.3;' +
                    'margin-top: 4px;' +
                    '">' +
                    'Codul CAEM2 este deja selectat ' +
                    'în coloana ' +
                    duplicateColumnNumber +
                    '.' +
                    '</div>';

                if ($select2Container.length) {
                    $select2Container.after(
                        message
                    );
                } else {
                    $field.after(
                        message
                    );
                }
            }

            function validateCap1CaemDuplicatesInline() {
                removeCap1CaemDuplicateMessages();

                var selectedCaemColumns = {};

                for (
                    var columnNumber = 2;
                    columnNumber <= 12;
                    columnNumber++
                ) {
                    var fieldSelector =
                        '#CAP1_CAEM_C' +
                        columnNumber;

                    var caem =
                        jQuery(fieldSelector).val() ||
                        '';

                    caem = String(caem).trim();

                    if (caem === '') {
                        continue;
                    }

                    if (
                        selectedCaemColumns.hasOwnProperty(
                            caem
                        )
                    ) {
                        /*
                         * Mesajul apare la aparițiile repetate,
                         * începând cu coloana 3.
                         */
                        if (columnNumber >= 3) {
                            showCap1CaemDuplicateMessage(
                                columnNumber,
                                selectedCaemColumns[
                                caem
                                ]
                            );
                        }
                    } else {
                        selectedCaemColumns[
                            caem
                        ] = columnNumber;
                    }
                }
            }

            $form
                .once(
                    'm1-cap1-caem-inline-duplicate'
                )
                .on(
                    'change select2:select select2:unselect',
                    'select[name^="CAP1_CAEM_C"]',
                    function () {
                        validateCap1CaemDuplicatesInline();
                    }
                );

            $form.on(
                'mywebform:sync',
                'select[name^="CAP1_CAEM_C"]',
                function () {
                    validateCap1CaemDuplicatesInline();
                }
            );

            // =====================================================
            // End verificare inline CAEM2 duplicate în Cap.1
            // =====================================================


            // =====================================================
            // Hide Cap2 Start
            // =====================================================

            function toggleCap2(trimValue) {
                if (
                    trimValue == 1 ||
                    trimValue == 2 ||
                    trimValue == 4
                ) {
                    jQuery('#header-1-2').hide();
                    jQuery('#CAP2').hide();

                    jQuery(
                        '#row-header-1, ' +
                        '#row-header-2, ' +
                        '#row-header-3, ' +
                        '#row-10, ' +
                        '#row-20, ' +
                        '#row-30, ' +
                        '#row-40, ' +
                        '#row-50, ' +
                        '#row-60, ' +
                        '#row-70, ' +
                        '#row-80, ' +
                        '#row-90, ' +
                        '#row-100, ' +
                        '#row-110, ' +
                        '#row-120, ' +
                        '#row-160, ' +
                        '#Caption_Cap2'
                    ).hide();

                    jQuery(
                        'input[name^="CAP2"]'
                    ).val('');

                    jQuery(
                        'select[name^="CAP2_CAEM"]'
                    ).each(function () {
                        jQuery(this)
                            .val('')
                            .trigger('change');

                        jQuery(this)
                            .next(
                                '.select2-container'
                            )
                            .find(
                                '.select2-selection--single'
                            )
                            .attr(
                                'tabindex',
                                '0'
                            );
                    });
                } else if (trimValue == 3) {
                    jQuery('#header-1-2').show();
                    jQuery('#CAP2').show();

                    jQuery(
                        '#row-header-1, ' +
                        '#row-header-2, ' +
                        '#row-header-3, ' +
                        '#row-10, ' +
                        '#row-20, ' +
                        '#row-30, ' +
                        '#row-40, ' +
                        '#row-50, ' +
                        '#row-60, ' +
                        '#row-70, ' +
                        '#row-80, ' +
                        '#row-90, ' +
                        '#row-100, ' +
                        '#row-110, ' +
                        '#row-120, ' +
                        '#row-160, ' +
                        '#Caption_Cap2'
                    ).show();
                }
            }

            jQuery('select[name="TRIM"]')
                .once('m1-trim-change')
                .on(
                    'change',
                    function () {
                        var trimValue =
                            jQuery(this).val();

                        toggleCap2(
                            trimValue
                        );

                        fillMainCaemFieldsM1();

                        if (
                            Number(trimValue) === 3
                        ) {
                            syncAllCap1CaemToCap2();
                        }

                        validateCap1CaemDuplicatesInline();
                    }
                );

            var initialTrimValue =
                jQuery(
                    'select[name="TRIM"]'
                ).val();

            toggleCap2(
                initialTrimValue
            );

            fillMainCaemFieldsM1();

            if (
                Number(initialTrimValue) === 3
            ) {
                syncAllCap1CaemToCap2();
            }

            validateCap1CaemDuplicatesInline();

            // =====================================================
            // Hide Cap2 End
            // =====================================================
        }
        //--------------------
     //--- 


    }
})(jQuery)

// function fill_section2_caem_fields($element) {
//     var caem = $element.val();

//     jQuery('select.Section2-caem')
//         .myWebformSelect2SetVal(caem)
//         .trigger('change');
// }

webform.validators.m1 = function (v, allowOverpass) {
    var values = Drupal.settings.mywebform.values;

    validatePhoneNumber(values.PHONE);
    validateCAEM_COL1_CAP1(values.CAEM);

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

    //--------------------------------------
    // function validateCAEM_COL1_CAP1(values) {
    //     // Initialize the values object if undefined
    //     if (typeof values === 'undefined') {
    //         values = {};
    //     }

    //     // Use the Select2 API to retrieve the selected CAEM value from the main field
    //     var caem = jQuery('#CAEM').select2('val');  // Get CAEM from the main activity
    //     var cap1_caem_c2_value = jQuery('#CAP1_CAEM_C2').select2('val');  // Get the value from the second field (Col 2)

    //     console.log('Main CAEM value:', caem);
    //     console.log('CAP1 CAEM C2 value:', cap1_caem_c2_value);

    //     // Handle case when fields_CAP1_CAEM2 (second column) is undefined or empty
    //     if (typeof cap1_caem_c2_value === 'undefined' || cap1_caem_c2_value === null || cap1_caem_c2_value === '') {
    //         // Optionally add an error for undefined or empty values
    //         webform.errors.push({
    //             'fieldName': 'CAP1_CAEM_C2',
    //             'msg': Drupal.t('Cod eroare: A.015 Trebuie selectat un cod CAEM pentru coloana 2.')
    //         });
    //         return; // Exit the function early since no valid CAEM is selected in column 2
    //     }

    //     // Check if the CAEM value from the main activity matches the second field
    //     if (caem !== cap1_caem_c2_value) {
    //         // Push error if CAEM does not match
    //         webform.errors.push({
    //             'fieldName': 'CAP1_CAEM_C1',
    //             'msg': Drupal.t(`Cod eroare: A.014 Cod CAEM (${caem}) trebuie sa fie acelasi ca si in Activitatea principală (${cap1_caem_c2_value})`)
    //         });
    //     }
    // }

    //-----------------------------------------------------

    //-------------------------------------------------------------

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
            var fields_CAP1_CAEM2 = jQuery('#CAP1 thead tr td:nth-child(' + arr_CAP1_inputs_2[i] + ')').find('select').val();

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

            // Start 05-003
            if (CAP1_R70 < CAP1_R71) {
                webform.errors.push({
                    'fieldName': 'CAP1_R71_C' + arr_CAP1_inputs_2[i],
                    'weight': 3,
                    'msg': Drupal.t('Cod eroare: 05-003 - Cap.1: R.71 ≤ R.70 pe toate coloanele. -> [@CAP1_R71] ≤ [@CAP1_R70]', { '@CAP1_R71': CAP1_R71, '@CAP1_R70': CAP1_R70 })
                });
            }

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

            // Start 05-013
            if (CAP1_R30 > 0 && CAP1_R70 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                    'weight': 13,
                    'msg': Drupal.t('Cod atenționare: 05-013 - Cap.1: Dacă există R.30 ar trebui să fie R.70 și invers.')
                });
            }
            if (CAP1_R70 > 0 && CAP1_R30 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                    'weight': 13,
                    'msg': Drupal.t('Cod atenționare: 05-013 - Cap.1: Dacă există R.30 ar trebui să fie R.70 și invers.')
                });
            }
            // End 05-013

            // Start 05-014
            if (CAP1_R31 > CAP1_R30) {
                webform.errors.push({
                    'fieldName': 'CAP1_R31_C' + arr_CAP1_inputs_2[i],
                    'weight': 14,
                    'msg': Drupal.t('Cod eroare: 05-014 - Cap.1: R.31 ≤ R.30 -> [@CAP1_R31] ≤ [@CAP1_R30]', { '@CAP1_R31': CAP1_R31, '@CAP1_R30': CAP1_R30 })
                });
            }
            // End 05-014

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

            // Start 05-028
            var CAP1_R10_C1 = 0;
            if (!isNaN(parseFloat(values['CAP1_R10_C1']))) {
                CAP1_R10_C1 = parseFloat(values['CAP1_R10_C1']);
            }
            if (CAP1_R31 > CAP1_R10_C1) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R30_C1',
                    'weight': 28,
                    'msg': Drupal.t('Cod atenționare: 05-028 - Cap.1: Col.1 R.30 ≤ R.10 -> [@CAP1_R31] ≤ [@CAP1_R10_C1]', { '@CAP1_R31': CAP1_R31, '@CAP1_R10_C1': CAP1_R10_C1 })
                });
            }
            //End 05-028

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

            // Start 05-036
            if (CAP1_R30 > 0) {
                var calcul2 = ((CAP1_R70 - CAP1_R73) * 1000 / (CAP1_R30)) / 3;
                //calcul2 = parseFloat(calcul2).toFixed(1);
                calcul2 = roundToDecimal(calcul2, 1); // calcul2 remains a number
                if ((calcul2 < 5500) || (calcul2 > 20000)) {
                    webform.warnings.push({
                        'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                        'weight': 36,
                        'msg': Drupal.t('Cod atenționare: 05-036 - Cap.1: (R.70 - R.73 * 1000 / R.30) / 3 > 5500 și < 20000 pe fiecare coloană. -> [@sum]', { '@sum': calcul2 })
                    });
                }
            }
            // End 05-036

            // Start 05-037
            if (CAP1_R31 > 0) {
                var calcul3 = ((CAP1_R74 * 1000) / (CAP1_R31)) / 3;
                //calcul3 = parseFloat(calcul3).toFixed(1);
                calcul3 = roundToDecimal(calcul3, 1);
                if ((calcul3 < 8000) || (calcul3 > 18000)) {
                    webform.warnings.push({
                        'fieldName': 'CAP1_R74_C' + arr_CAP1_inputs_2[i],
                        'weight': 37,
                        'msg': Drupal.t('Cod atenționare: 05-037 - Cap. 1: (R.74 * 1000 / R.31) / 3 > 8000 și < 18000 pe fiecare coloană. -> [@sum]', { '@sum': calcul3 })
                    });
                }
            }
            // End 05-037

            // Start 05-039
            if (CAP1_R40 > 0) {
                var calcul4 = ((CAP1_R73 * 1000) / (CAP1_R40)) / 3;
                //calcul4 = parseFloat(calcul4).toFixed(1);
                calcul4 = roundToDecimal(calcul4, 1);
                if ((calcul4 < 5500) || (calcul4 > 20000)) {
                    webform.warnings.push({
                        'fieldName': 'CAP1_R73_C' + arr_CAP1_inputs_2[i],
                        'weight': 39,
                        'msg': Drupal.t('Cod atenționare: 05-039 - Cap. 1: (R.73 * 1000 / R.40) / 3 > 5500 și < 20000 pe fiecare coloană. -> [@sum]', { '@sum': calcul4 })
                    });
                }
            }
            // End 05-039

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

            // Start 05-043
            if ((CAP1_R40 > 0 && CAP1_R30 === 0) && CAP1_R70 !== CAP1_R73) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                    'weight': 43,
                    'msg': Drupal.t('Cod atenționare: 05-043 - Cap.1: Dacă R.40 > 0 și R.30 = 0, atunci R.70 = R.73 și invers, pe fiecare coloană.')
                });
            }
            if ((CAP1_R70 === CAP1_R73 && CAP1_R40 === 0) || (CAP1_R70 === CAP1_R73 && CAP1_R30 > 0)) {
                if (CAP1_R70 !== 0) {
                    webform.warnings.push({
                        'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                        'weight': 43,
                        'msg': Drupal.t('Cod atenționare: 05-043 - Cap.1: Dacă R.40 > 0 și R.30 = 0, atunci R.70 = R.73 și invers, pe fiecare coloană.')
                    });
                }
            }
            // End 05-043

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
        var fields_CAP1_CAEM1 = jQuery('#CAP1 thead tr td:nth-child(' + k + ')').find('select').val();
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
    var trimValue = jQuery('select[name="TRIM"]').val();  // Obținem valoarea curentă a TRIM

    // Începem validarea pentru CAP1, care se verifică în orice TRIM
    for (var h = 2; h < 13; h++) {
        var fields_CAP1_CAEM3 = jQuery('#CAP1 thead tr td:nth-child(' + h + ')').find('select').val();

        // Verificăm dacă valoarea nu este goală înainte de comparare
        if (fields_CAP1_CAEM3 !== '') {
            for (var m = 2; m < 13; m++) {
                if (h != m) {
                    var fields_CAP1_CAEM4 = jQuery('#CAP1 thead tr td:nth-child(' + m + ')').find('select').val();

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
            var fields_CAP2_CAEM2 = jQuery('#CAP2 thead tr td:nth-child(' + h + ')').find('select').val();

            // Verificăm dacă valoarea nu este goală înainte de comparare
            if (fields_CAP2_CAEM2 !== '') {
                for (var m = 2; m < 13; m++) {
                    if (h != m) {
                        var fields_CAP2_CAEM3 = jQuery('#CAP2 thead tr td:nth-child(' + m + ')').find('select').val();

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
                var fields_CAP2_CAEM1 = jQuery('#CAP2 thead tr td:nth-child(' + arr_CAP2_inputs_2[i] + ')').find('select').val();
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
            var fields_CAP1_CAEM5 = jQuery('#CAP1 thead tr td:nth-child(' + h + ')').find('select').val();
            var fields_CAP2_CAEM4 = jQuery('#CAP2 thead tr td:nth-child(' + h + ')').find('select').val();
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

    webform.validatorsStatus['m1'] = 1;
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
    var caem = jQuery('#CAEM').select2('val');  // Get CAEM from the main activity
    var cap1_caem_c2_value = jQuery('#CAP1_CAEM_C2').select2('val');  // Get the value from the second field (Col 2)

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