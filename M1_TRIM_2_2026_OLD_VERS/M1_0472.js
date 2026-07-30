(function ($) {
    Drupal.behaviors.m1 = {
        attach: function (context, settings) {
            jQuery('#mywebform-edit-form').on('mywebform:gridRefreshField', 'input.dynamic-region', function () {
                var val = jQuery(this).val();  // Get the value without converting to String first

                // Ensure val is not null or undefined before proceeding
                if (val !== null && val !== undefined) {
                    var processed_val = String(val).trim();  // Safely convert to string and trim

                    // Use strict comparison to avoid type coercion
                    if (val !== processed_val) {
                        jQuery(this).val(processed_val).trigger('change');
                    }
                } else {
                    console.warn("Input value is null or undefined");
                }
            });

            jQuery('#mywebform-edit-form', context).on('keypress', 'input.numeric, input.money, input.float', function (event) {
                if (isNumberPressed(this, event) === false) {
                    event.preventDefault();
                }
            });

            //
            jQuery('#mywebform-edit-form', context).on('paste', 'input.numeric, input.money, input.float', function (event) {
                var obj = event.originalEvent || event;

                if (typeof obj.clipboardData !== 'undefined') {
                    var value = obj.clipboardData.getData('text/plain').trim();  // Trim whitespace to handle cases like " 123 "

                    // Use regex to validate if the pasted value is a valid number (allows decimals)
                    var isNumeric = /^[+-]?\d+(\.\d+)?$/.test(value);
                    var number = isNumeric ? Number(value) : NaN;  // Convert to number if valid, otherwise set to NaN

                    if (!isNumeric || isNaN(number) || is_negative(number)) {  // Prevent invalid number or negative values
                        event.preventDefault();
                        console.warn("Pasted value is not a valid number or is negative:", value);
                    } else {
                        jQuery(this).val(number);  // Set valid number to input field
                    }
                }
            });

            //

            jQuery('#mywebform-edit-form').on('mywebform:sync', 'input', function () {
                var $this = jQuery(this);
                var fieldName = $this.attr('field');
            });

            jQuery('#mywebform-edit-form').on('mywebform:sync', 'select.Section-caem', function () {
                //fill_section2_caem_fields(jQuery(this));
            });

            // Hide Cap2  Start
            // FuncИ›ie pentru a ascunde sau afiИ™a capitolul 1.2 Г®n funcИ›ie de TRIM
            function toggleCap2(trimValue) {
                if (trimValue == 1 || trimValue == 2 || trimValue == 4) {
                    // Ascundere capitol 1.2 dacДѓ TRIM nu este 3
                    jQuery('#header-1-2').hide();  // Ascunde headerul capitolului 1.2
                    jQuery('#CAP2').hide();        // Ascunde tabelul corespunzДѓtor capitolului 1.2
                    jQuery('#row-header-1, #row-header-2, #row-header-3, #row-10, #row-30, #row-40, #row-50, #row-60, #row-70, #row-80, #row-90, #row-100, #row-110, #row-120, #row-160, #Caption_Cap2').hide();

                    // CurДѓИ›Дѓm toate valorile input-urilor din capitolul 1.2
                    jQuery('input[name^="CAP2"]').val('');

                    // DeselectДѓm valorile select2 И™i setДѓm tabindex la 0
                    jQuery('select[name^="CAP2_CAEM"]').each(function () {
                        jQuery(this).val('').trigger('change');  // DeselectДѓm valorile CAEM2
                        jQuery(this).next('.select2-container').find('.select2-selection--single').attr('tabindex', '0');  // SetДѓm tabindex la 0
                    });

                } else if (trimValue == 3) {
                    // AfiИ™Дѓm capitolul 1.2 dacДѓ TRIM este 3
                    jQuery('#header-1-2').show();  // AfiИ™eazДѓ headerul capitolului 1.2
                    jQuery('#CAP2').show();        // AfiИ™eazДѓ tabelul corespunzДѓtor capitolului 1.2
                    jQuery('#row-header-1, #row-header-2, #row-header-3, #row-10, #row-30, #row-40, #row-50, #row-60, #row-70, #row-80, #row-90, #row-100, #row-110, #row-120, #row-160, #Caption_Cap2').show();

                    // AfiИ™Дѓm И™i lДѓsДѓm formularul sДѓ funcИ›ioneze implicit fДѓrДѓ a face modificДѓri
                }
            }

            // Eveniment pentru a detecta schimbarea valorii select TRIM
            jQuery('select[name="TRIM"]').change(function () {
                var trimValue = jQuery(this).val();
                toggleCap2(trimValue);
            });

            // ApeleazДѓ funcИ›ia toggleCap2 iniИ›ial dacДѓ este nevoie
            var initialTrimValue = jQuery('select[name="TRIM"]').val();
            toggleCap2(initialTrimValue);

            // Hide Cap2  End


        }
    }
})(jQuery)

// function fill_section2_caem_fields($element) {
//     var caem = $element.val();

//     jQuery('select.Section2-caem')
//         .myWebformSelect2SetVal(caem)
//         .trigger('change');
// }

webform.validators.m1 = function (v, allowOverpass) {
  //  var values = drupalSettings.mywebform.values;
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

    // ApelДѓm funcИ›ia de validare pentru CAEM2
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
                'msg': Drupal.t(' Cod eroare: A.09 IntroduceИ›i doar un numДѓr de telefon format din 9 cifre')
            });
        }
        // Check if the first digit is 0
        if (values.PHONE && values.PHONE[0] !== '0') {
            webform.errors.push({
                'fieldName': 'PHONE',
                'msg': Drupal.t(' Cod eroare: A.09 Prima cifrДѓ a numДѓrului de telefon trebuie sДѓ fie 0')
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
    //             'msg': Drupal.t(`Cod eroare: A.014 Cod CAEM (${caem}) trebuie sa fie acelasi ca si in Activitatea principalДѓ (${cap1_caem_c2_value})`)
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                        'msg': Drupal.t('Cod eroare: 05-021 - Cap.1: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
                    });
                }
            }
            // End 05-021

            // Start 05-003
            if (CAP1_R70 < CAP1_R71) {
                webform.errors.push({
                    'fieldName': 'CAP1_R71_C' + arr_CAP1_inputs_2[i],
                    'weight': 3,
                    'msg': Drupal.t('Cod eroare: 05-003 - Cap.1: R.71 в‰¤ R.70 pe toate coloanele. -> [@CAP1_R71] в‰¤ [@CAP1_R70]', { '@CAP1_R71': CAP1_R71, '@CAP1_R70': CAP1_R70 })
                });
            }

            // Start 05-007
            var sum_CAP1_R71_074 = CAP1_R71 + CAP1_R72 + CAP1_R73 + CAP1_R74;
            sum_CAP1_R71_074 = roundToDecimal(sum_CAP1_R71_074, 1);
            if (CAP1_R70 < sum_CAP1_R71_074) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                    'weight': 7,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-007 - Cap.1: Suma R.(71, 72, 73, 74) в‰¤ R.70 -> [@sum_CAP1_R71_074] в‰¤ [@CAP1_R70]', { '@sum_CAP1_R71_074': sum_CAP1_R71_074, '@CAP1_R70': CAP1_R70 })
                });
            }
            // End 05-007

            // Start 05-009
            if (CAP1_R20 > CAP1_R10) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R20_C' + arr_CAP1_inputs_2[i],
                    'weight': 9,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-009 - Cap.1: R.20 в‰¤ R.10 -> [@CAP1_R20] в‰¤ [@CAP1_R10]', { '@CAP1_R20': CAP1_R20, '@CAP1_R10': CAP1_R10 })
                });
            }
            // End 05-009

            // Start 05-010
            if (CAP1_R40 > CAP1_R30) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R40_C' + arr_CAP1_inputs_2[i],
                    'weight': 10,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-010 - Cap.1: R.40 в‰¤ R.30 -> [@CAP1_R40] в‰¤ [@CAP1_R30]', { '@CAP1_R40': CAP1_R40, '@CAP1_R30': CAP1_R30 })
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
                        'msg': Drupal.t('Cod atenИ›ionare: 05-012 - Cap.1: R.50 * 1000 / (R.30 + R.40) в‰¤ 570 И™i > 450 pe toate coloanele. -> [@sum]', { '@sum': calcul1 })
                    });
                }
            }
            // End 05-012

            // Start 05-013
            if (CAP1_R30 > 0 && CAP1_R70 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                    'weight': 13,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-013 - Cap.1: DacДѓ existДѓ R.30 ar trebui sДѓ fie R.70 И™i invers.')
                });
            }
            if (CAP1_R70 > 0 && CAP1_R30 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                    'weight': 13,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-013 - Cap.1: DacДѓ existДѓ R.30 ar trebui sДѓ fie R.70 И™i invers.')
                });
            }
            // End 05-013

            // Start 05-014
            if (CAP1_R31 > CAP1_R30) {
                webform.errors.push({
                    'fieldName': 'CAP1_R31_C' + arr_CAP1_inputs_2[i],
                    'weight': 14,
                    'msg': Drupal.t('Cod eroare: 05-014 - Cap.1: R.31 в‰¤ R.30 -> [@CAP1_R31] в‰¤ [@CAP1_R30]', { '@CAP1_R31': CAP1_R31, '@CAP1_R30': CAP1_R30 })
                });
            }
            // End 05-014

            // Start 05-023
            if (CAP1_R50 > 0 && CAP1_R30 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                    'weight': 23,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-023 - Cap.1: DacДѓ existДѓ R.30 ar trebui sДѓ fie И™i R.50 И™i invers, pentru toate coloanele.')
                });
            }
            if (CAP1_R30 > 0 && CAP1_R50 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                    'weight': 23,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-023 - Cap.1: DacДѓ existДѓ R.30 ar trebui sДѓ fie И™i R.50 И™i invers, pentru toate coloanele.')
                });
            }
            // End 05-023

            // Start 05-025
            if (CAP1_R31 > 0 && CAP1_R74 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R74_C' + arr_CAP1_inputs_2[i],
                    'weight': 25,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-025 - Cap.1: DacДѓ existДѓ R.31 ar trebui sДѓ fie R.74 И™i invers, pe toate coloanele.')
                });
            }
            if (CAP1_R74 > 0 && CAP1_R31 == 0) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R74_C' + arr_CAP1_inputs_2[i],
                    'weight': 25,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-025 - Cap.1: DacДѓ existДѓ R.31 ar trebui sДѓ fie R.74 И™i invers, pe toate coloanele.')
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
                    'msg': Drupal.t('Cod atenИ›ionare: 05-028 - Cap.1: Col.1 R.30 в‰¤ R.10 -> [@CAP1_R31] в‰¤ [@CAP1_R10_C1]', { '@CAP1_R31': CAP1_R31, '@CAP1_R10_C1': CAP1_R10_C1 })
                });
            }
            //End 05-028

            // Start 05-030
            if (CAP1_R40 > 0 && CAP1_R73 == 0) {
                webform.errors.push({
                    'fieldName': 'CAP1_R73_C' + arr_CAP1_inputs_2[i],
                    'weight': 30,
                    'msg': Drupal.t('Cod eroare: 05-030 - Cap.1: DacДѓ existДѓ R.40 ar trebui sДѓ fie R.73 И™i invers, pe toate coloanele.')
                });
            }
            if (CAP1_R73 > 0 && CAP1_R40 == 0) {
                webform.errors.push({
                    'fieldName': 'CAP1_R40_C' + arr_CAP1_inputs_2[i],
                    'weight': 30,
                    'msg': Drupal.t('Cod eroare: 05-030 - Cap.1: DacДѓ existДѓ R.40 ar trebui sДѓ fie R.73 И™i invers, pe toate coloanele.')
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
                        'msg': Drupal.t('Cod atenИ›ionare: 05-036 - Cap.1: (R.70 - R.73 * 1000 / R.30) / 3 > 5500 И™i < 20000 pe fiecare coloanДѓ. -> [@sum]', { '@sum': calcul2 })
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
                        'msg': Drupal.t('Cod atenИ›ionare: 05-037 - Cap. 1: (R.74 * 1000 / R.31) / 3 > 8000 И™i < 18000 pe fiecare coloanДѓ. -> [@sum]', { '@sum': calcul3 })
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
                        'msg': Drupal.t('Cod atenИ›ionare: 05-039 - Cap. 1: (R.73 * 1000 / R.40) / 3 > 5500 И™i < 20000 pe fiecare coloanДѓ. -> [@sum]', { '@sum': calcul4 })
                    });
                }
            }
            // End 05-039

            // Start 05-040
            if (CAP1_R10 > 0 && CAP1_R30 == 0) {
                webform.errors.push({
                    'fieldName': 'CAP1_R30_C' + arr_CAP1_inputs_2[i],
                    'weight': 40,
                    'msg': Drupal.t('Cod eroare: 05-040 - Cap.1: DacДѓ existДѓ R.10 ar trebui sДѓ fie R.30, pe toate coloanele.')
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
                    'msg': Drupal.t('Cod atenИ›ionare: 05-043 - Cap.1: DacДѓ R.40 > 0 И™i R.30 = 0, atunci R.70 = R.73 И™i invers, pe fiecare coloanДѓ.')
                });
            }
            if ((CAP1_R70 === CAP1_R73 && CAP1_R40 === 0) || (CAP1_R70 === CAP1_R73 && CAP1_R30 > 0)) {
                if (CAP1_R70 !== 0) {
                    webform.warnings.push({
                        'fieldName': 'CAP1_R70_C' + arr_CAP1_inputs_2[i],
                        'weight': 43,
                        'msg': Drupal.t('Cod atenИ›ionare: 05-043 - Cap.1: DacДѓ R.40 > 0 И™i R.30 = 0, atunci R.70 = R.73 И™i invers, pe fiecare coloanДѓ.')
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
                        'msg': Drupal.t('Cod atenИ›ionare: 05-044 - Cap.1: ((R.70 - R.74) * 1000 / (R.30 - R.31)) / 3 > 4000 -> [@sum] > [4000]', { '@sum': calcul5 })
                    });
                }
            }
            // End 05-044

            // Start 05-050
            if ((CAP1_R10 == CAP1_R20) && (CAP1_R10 != 0) && (CAP1_R20 != 0)) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R20_C' + arr_CAP1_inputs_2[i],
                    'weight': 50,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-050 - Cap.1: R.10 в‰  R.20, pe fiecare coloanДѓ. -> [@CAP1_R10] в‰  [@CAP1_R20]', { '@CAP1_R10': CAP1_R10, '@CAP1_R20': CAP1_R20 })
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
                    'msg': Drupal.t('Cod atenИ›ionare: 05-051 - Cap.1: R.70 в‰  R.71 + R.73 + R.74 -> [@CAP1_R70] в‰  [@sum_CAP1_R71_073_074]', { '@CAP1_R70': CAP1_R70, '@sum_CAP1_R71_073_074': sum_CAP1_R71_073_074 })
                });
            }
            // End 05-051

            // Start 05-053
            if (CAP1_R200 > CAP1_R10) {
                webform.warnings.push({
                    'fieldName': 'CAP1_R200_C' + arr_CAP1_inputs_2[i],
                    'weight': 53,
                    'msg': Drupal.t('Cod atenИ›ionare: 05-053 - Cap.1: R.200 в‰¤ R.10 -> [@CAP1_R200] в‰¤ [@CAP1_R10]', { '@CAP1_R200': CAP1_R200, '@CAP1_R10': CAP1_R10 })
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
            'msg': Drupal.t('Cod atenИ›ionare: 05-052 - Cap.1: R.200 в‰Ґ 0 вЂ“ asiguraИ›i-vДѓ cДѓ nu aveИ›i locuri vacante (dacДѓ nu, atunci 0). -> [@CAP1_R200_C1] в‰Ґ [0]', { '@CAP1_R200_C1': values.CAP1_R200_C1 })
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
                'msg': Drupal.t('Cod atenИ›ionare: 05-015 - Cap.1: R.31 se introduce, dacДѓ Activitatea CAEM = {Q86,Q87,P85}, excepИ›ie  P856, P8553 И™i P8559, Col.2-12')
            });
        }
        function warnings_push_r74c_015_secondary(k) {
            webform.warnings.push({
                'fieldName': 'CAP1_R74_C' + k,
                'weight': 15,
                'msg': Drupal.t('Cod atenИ›ionare: 05-015 - Cap.1: R.74 se introduce, dacДѓ Activitatea CAEM = {Q86,Q87,P85}, excepИ›ie  P856, P8553 И™i P8559, Col.2-12')
            });
        }
        // End 05-015
    }

    // Start 05-031 - Validarea codurilor CAEM pentru duplicate
    var trimValue = jQuery('select[name="TRIM"]').val();  // ObИ›inem valoarea curentДѓ a TRIM

    // ГЋncepem validarea pentru CAP1, care se verificДѓ Г®n orice TRIM
    for (var h = 2; h < 13; h++) {
        var fields_CAP1_CAEM3 = jQuery('#CAP1 thead tr td:nth-child(' + h + ')').find('select').val();

        // VerificДѓm dacДѓ valoarea nu este goalДѓ Г®nainte de comparare
        if (fields_CAP1_CAEM3 !== '') {
            for (var m = 2; m < 13; m++) {
                if (h != m) {
                    var fields_CAP1_CAEM4 = jQuery('#CAP1 thead tr td:nth-child(' + m + ')').find('select').val();

                    // ValidДѓm doar dacДѓ ambele valori nu sunt goale И™i sunt egale
                    if (fields_CAP1_CAEM4 == fields_CAP1_CAEM3 && fields_CAP1_CAEM4 !== '') {
                        webform.errors.push({
                            'fieldName': 'CAP1_CAEM_C' + m,
                            'weight': 31,
                            'msg': Drupal.t('Cod eroare: 05-031 - Cod CAEM nu trebuie sДѓ se repete.')
                        });
                    }
                }
            }
        }
    }

    // DacДѓ TRIM este 3, verificДѓm И™i capitolul CAP2
    if (trimValue == 3) {
        for (var h = 2; h < 13; h++) {
            var fields_CAP2_CAEM2 = jQuery('#CAP2 thead tr td:nth-child(' + h + ')').find('select').val();

            // VerificДѓm dacДѓ valoarea nu este goalДѓ Г®nainte de comparare
            if (fields_CAP2_CAEM2 !== '') {
                for (var m = 2; m < 13; m++) {
                    if (h != m) {
                        var fields_CAP2_CAEM3 = jQuery('#CAP2 thead tr td:nth-child(' + m + ')').find('select').val();

                        // ValidДѓm doar dacДѓ ambele valori nu sunt goale И™i sunt egale
                        if (fields_CAP2_CAEM3 == fields_CAP2_CAEM2 && fields_CAP2_CAEM3 !== '') {
                            webform.errors.push({
                                'fieldName': 'CAP2_CAEM_C' + m,
                                'weight': 31,
                                'msg': Drupal.t('Cod eroare: 05-031 - Cod CAEM nu trebuie sДѓ se repete.')
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
    for (var i = 10; i <= 74; i += 10) {  // AjusteazДѓ intervalul de rГўnduri pentru Capitolul 1
        let col1Value = parseFloat(values["CAP1_R" + i + "_C1"]);
        let colSum = 0;

        // VerificДѓm dacДѓ col1Value este un numДѓr valid; dacДѓ este NaN, atribuim 0
        if (isNaN(col1Value)) {
            col1Value = 0;
        }

        // SumДѓm valorile de la Coloana 2 pГўnДѓ la Coloana 12
        for (let col = 2; col <= 12; col++) {
            let colValue = parseFloat(values["CAP1_R" + i + "_C" + col]);
            if (isNaN(colValue)) {
                colValue = 0;
            }
            colSum += colValue;
        }

        // Rotunjim suma la 1 zecimalДѓ, dacДѓ este necesar
        colSum = roundToDecimal(colSum, 1);

        // ValidДѓm dacДѓ Coloana 1 este egalДѓ cu suma Coloanelor 2-12
        if (col1Value !== colSum) {
            webform.errors.push({
                'fieldName': 'CAP1_R' + i + '_C1',
                'weight': 1,
                'msg': Drupal.t('Cod eroare: 05-002 - Col.1 trebuie sДѓ fie egalДѓ cu suma Col.2-12 pentru rГўndul @row. Valoarea Col.1: [@col1], Suma Col.2-12: [@colSum]',
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

    // // RГўnduri specifice pentru Capitolul 1 care nu se Г®mpart la 10
    const specialRowsCap1 = [31, 51, 52, 71, 72, 73, 74];

    specialRowsCap1.forEach(function (row) {
        // Validare pentru Capitolul 1
        let col1ValueCap1 = parseFloat(values["CAP1_R" + row + "_C1"]);
        let colSumCap1 = 0;

        // VerificДѓm dacДѓ col1ValueCap1 este un numДѓr valid, atribuim 0 dacДѓ este NaN
        if (isNaN(col1ValueCap1)) {
            col1ValueCap1 = 0;
        }

        // SumДѓm valorile de la Coloana 2 pГўnДѓ la Coloana 12 pentru Capitolul 1
        for (let col = 2; col <= 12; col++) {
            let colValue = parseFloat(values["CAP1_R" + row + "_C" + col]);
            if (isNaN(colValue)) {
                colValue = 0;
            }
            colSumCap1 += colValue;
        }

        colSumCap1 = roundToDecimal(colSumCap1, 1);

        // ValidДѓm dacДѓ Coloana 1 este egalДѓ cu suma Coloanelor 2-12 pentru Capitolul 1
        if (col1ValueCap1 !== colSumCap1) {
            webform.errors.push({
                'fieldName': 'CAP1_R' + row + '_C1',
                'weight': 1,
                'msg': Drupal.t('Cod eroare: 05-003 - Capitolul 1: Col.1 trebuie sДѓ fie egalДѓ cu suma Col.2-12 pentru rГўndul @row. Valoarea Col.1: [@col1], Suma Col.2-12: [@colSum]',
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

        // // Se modificДѓ acest interval pentru a include rГўndurile corecte
        for (var i = 10; i <= 160; i += 10) {
            let col1Value = parseFloat(values["CAP2_R" + i + "_C1"]);
            let colSum = 0;

            // AsigurДѓm cДѓ col1Value este un numДѓr valid, atribuim 0 dacДѓ este NaN
            if (isNaN(col1Value)) {
                col1Value = 0;  // Atribuim 0 dacДѓ col1Value este NaN
            }

            // SumДѓm coloanele 2 pГўnДѓ la 12 pentru rГўndul curent cu verificare NaN
            for (let col = 2; col <= 12; col++) {
                let colValue = parseFloat(values["CAP2_R" + i + "_C" + col]);
                if (isNaN(colValue)) {
                    colValue = 0;  // Atribuim 0 dacДѓ colValue este NaN
                }
                colSum += colValue;  // AdДѓugДѓm valoarea fiecДѓrei coloane
            }

            // Rotunjim suma la 1 zecimalДѓ, dacДѓ este necesar
            colSum = roundToDecimal(colSum, 1);

            // DacДѓ Col.1 nu este egalДѓ cu suma Col.2-12, adДѓugДѓm o eroare
            if (col1Value !== colSum) {
                webform.errors.push({
                    'fieldName': 'CAP2_R' + i + '_C1',
                    'weight': 1,
                    'msg': Drupal.t('Cod eroare: 05-001 - Col.2 trebuie sДѓ fie egalДѓ cu suma Col.2-12 pentru rГўndul @row. Valoarea curentДѓ Col.1: [@col1], Suma Col.2-12: [@colSum]',
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
        var arr_CAP2_L = ['10', '20', '30', '40', '60', '70', '80', '90', '100', '110', '120'];
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
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
                            'msg': Drupal.t('Cod eroare: 05-021 - Cap.2: Pentru orice coloanДѓ cu date existДѓ cod CAEM, Cap.1-2')
                        });
                    }
                }
                // End 05-021

                // Start 07-007
                var sum_CAP_R020_120 = CAP2_R20 + CAP2_R30 + CAP2_R40 + CAP2_R60 + CAP2_R70 + CAP2_R80 + CAP2_R90 + CAP2_R100 + CAP2_R110 + CAP2_R120;
                sum_CAP_R020_120 = roundToDecimal(sum_CAP_R020_120, 1);
                if ((CAP2_R10 < (sum_CAP_R020_120)) || (CAP2_R10 > (sum_CAP_R020_120))) {
                    webform.errors.push({
                        'fieldName': 'CAP2_R10_C' + arr_CAP2_inputs_2[i],
                        'weight': 7,
                        'msg': Drupal.t('Cod eroare: 07-007 - Cap.2: SUM(R..20, ..., 120) = R.10, pe toate coloanele. -> [@sum_CAP_R020_120] = [@CAP2_R10]', { '@sum_CAP_R020_120': sum_CAP_R020_120, '@CAP2_R10': CAP2_R10 })
                    });
                }
                // End 07-007

                // Start 07-009
                if (CAP2_R10 > 0) {
                    var min_CAP2_R20 = 0 * CAP2_R20;
                    var min_CAP2_R30 = 6300 * CAP2_R30;
                    var min_CAP2_R40 = 6300 * CAP2_R40;
                    var min_CAP2_R50 = 0; // R.50 eliminat în 2026
                    var min_CAP2_R60 = 7000 * CAP2_R60;
                    var min_CAP2_R70 = 8000 * CAP2_R70;
                    var min_CAP2_R80 = 10000 * CAP2_R80;
                    var min_CAP2_R90 = 15000 * CAP2_R90;
                    var min_CAP2_R100 = 20000 * CAP2_R100;
                    var min_CAP2_R110 = 25000 * CAP2_R110;
                    var min_CAP2_R120 = 30000 * CAP2_R120;
                    var min_CAP2_R160 = 0;
                    min_CAP2_R160 = (min_CAP2_R20 + min_CAP2_R30 + min_CAP2_R40 + min_CAP2_R50 + min_CAP2_R60 + min_CAP2_R70 + min_CAP2_R80 + min_CAP2_R90 + min_CAP2_R100 + min_CAP2_R110 + min_CAP2_R120 + min_CAP2_R160) / 1000;
                    // min_CAP2_R160 = parseFloat(min_CAP2_R160).toFixed(1);
                    min_CAP2_R160 = roundToDecimal(min_CAP2_R160, 1);
                    var max_CAP2_R20 = 6300 * CAP2_R20;
                    var max_CAP2_R30 = 6300 * CAP2_R30;
                    var max_CAP2_R40 = 7000 * CAP2_R40;
                    var max_CAP2_R50 = 0; // R.50 eliminat în 2026
                    var max_CAP2_R60 = 8000 * CAP2_R60;
                    var max_CAP2_R70 = 10000 * CAP2_R70;
                    var max_CAP2_R80 = 15000 * CAP2_R80;
                    var max_CAP2_R90 = 20000 * CAP2_R90;
                    var max_CAP2_R100 = 25000 * CAP2_R100;
                    var max_CAP2_R110 = 30000 * CAP2_R110;
                    var max_CAP2_R120 = 40000 * CAP2_R120;
                    var max_CAP2_R160 = 0;
                    max_CAP2_R160 = (max_CAP2_R20 + max_CAP2_R30 + max_CAP2_R40 + max_CAP2_R50 + max_CAP2_R60 + max_CAP2_R70 + max_CAP2_R80 + max_CAP2_R90 + max_CAP2_R100 + max_CAP2_R110 + max_CAP2_R120 + max_CAP2_R160) / 1000;
                    //max_CAP2_R160 = parseFloat(max_CAP2_R160).toFixed(1);
                    max_CAP2_R160 = roundToDecimal(max_CAP2_R160, 1);
                    if ((CAP2_R160 < min_CAP2_R160) || (CAP2_R160 > max_CAP2_R160)) {
                        webform.warnings.push({
                            'fieldName': 'CAP2_R160_C' + arr_CAP2_inputs_2[i],
                            'weight': 9,
                            'msg': Drupal.t('Cod atenИ›ionare: 07-009 - Cap.2: Verificarea la minimum И™i maximum. -> Cap.2 R.160 = [@CAP2_R160], minim = [@min_CAP2_R160] И™i maxim = [@max_CAP2_R160]', { '@CAP2_R160': CAP2_R160, '@min_CAP2_R160': min_CAP2_R160, '@max_CAP2_R160': max_CAP2_R160 })
                        });
                    }
                }
                // End 07-009

                // Start 07-016
                if (CAP2_R120 == 0 && CAP2_R10 > 0) {
                    var max_CAP2_R20 = 6300 * CAP2_R20;
                    var max_CAP2_R30 = 6300 * CAP2_R30;
                    var max_CAP2_R40 = 7000 * CAP2_R40;
                    var max_CAP2_R50 = 0; // R.50 eliminat în 2026
                    var max_CAP2_R60 = 8000 * CAP2_R60;
                    var max_CAP2_R70 = 10000 * CAP2_R70;
                    var max_CAP2_R80 = 15000 * CAP2_R80;
                    var max_CAP2_R90 = 20000 * CAP2_R90;
                    var max_CAP2_R100 = 25000 * CAP2_R100;
                    var max_CAP2_R110 = 30000 * CAP2_R110;
                    var max_CAP2_R160 = 0;
                    max_CAP2_R160 = (max_CAP2_R20 + max_CAP2_R30 + max_CAP2_R40 + max_CAP2_R50 + max_CAP2_R60 + max_CAP2_R70 + max_CAP2_R80 + max_CAP2_R90 + max_CAP2_R100 + max_CAP2_R110 + max_CAP2_R160) / 1000;
                    //max_CAP2_R160 = parseFloat(max_CAP2_R160).toFixed(1);
                    max_CAP2_R160 = roundToDecimal(max_CAP2_R160, 1);
                    if ((CAP2_R160 > max_CAP2_R160)) {
                        webform.errors.push({
                            'fieldName': 'CAP2_R160_C' + arr_CAP2_inputs_2[i],
                            'weight': 16,
                            'msg': Drupal.t('Cod eroare: 07-016 - Cap.2: Verificarea la maximum dacДѓ lipseИ™te R.120 -> Cap.2 R.160 = [@CAP2_R160], maxim = [@max_CAP2_R160]', { '@CAP2_R160': CAP2_R160, '@max_CAP2_R160': max_CAP2_R160 })
                        });
                    }
                }
                // End 07-016

                // Start 07-018
                if (CAP2_R20 > 0) {
                    webform.warnings.push({
                        'fieldName': 'CAP2_R10_C' + arr_CAP2_inputs_2[i],
                        'weight': 18,
                        'msg': Drupal.t('Cod atenИ›ionare: 07-018 - Cap.2: AsiguraИ›i-vДѓ de corectitudinea datelor. Salariul minim = 6300 lei. -> [@CAP2_R20]', { '@CAP2_R20': CAP2_R20 })
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
                    'msg': Drupal.t('Cod atenИ›ionare: 07-006 - Cap.2: R.10 в‰¤ Cap.1 R.30, pe toate coloanele. -> [@CAP2_R10] в‰¤ [@CAP1_R30]', { '@CAP2_R10': CAP2_R10, '@CAP1_R30': CAP1_R30 })
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
                        'msg': Drupal.t('Cod atenИ›ionare: 07-015 - Cap.2: R.160 в‰¤ R.70 - R.73 / 3 Cap.1 pe toate coloanele. -> [@CAP2_R160] в‰¤ [@calcul6]', { '@CAP2_R160': CAP2_R160, '@calcul6': calcul6 })
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
                        'msg': Drupal.t('Cod atenИ›ionare: 07-017 - DacДѓ Cap.1 R.30 * 100 / R.10 в‰Ґ 70%, Г®n Cap.2 ar trebui sДѓ existe R.10, pe toate coloanele. -> [@calcul7]% в‰Ґ [70]%', { '@calcul7': calcul7 })
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
                    'msg': Drupal.t('Cod eroare: 07-010 - Cod CAEM din Cap.2 trebuie sДѓ coincidДѓ cu cod CAEM din Cap.1')
                });
            }
        }
        // End 07-010

        // Start 07-023

        // Utility function to safely divide two numbers
        function safeDivide(numerator, divisor) {
            if (divisor === 0) {
                return 0;
            }
            return numerator / divisor;
        }
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

        // Use safeDivide to handle division safely
        var calcul8 = safeDivide(CAP2_R160_C1 * 1000, CAP2_R10_C1) / CAP1_R120_C1 * 100;
        calcul8 = roundToDecimal(calcul8, 1);

        // Check if the result is within the range [85, 130]
        if ((calcul8 < 85) || (calcul8 > 130)) {
            webform.warnings.push({
                'fieldName': 'CAP2_R160_C1',
                'weight': 23,
                'msg': Drupal.t('Cod atenИ›ionare: 07-023 - (Cap.2 R.160 Col.1 * 1000 / R.10 Col.1) / Cap.1 R.120 Col.1 * 100 = [85-130]% -> [@calcul8]%', { '@calcul8': calcul8 })
            });
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
                    'msg': Drupal.t('Cod atenИ›ionare: 07-024 - (Cap.1 Col.1 (R.70 - R.73) / 3 - Cap.2 R.160 Col.1) * 1000 / (Cap.1 R.30 Col.1 - Cap.2 R.10 Col.1) > 3000 -> [@calcul9] > [3000]', { '@calcul9': calcul9 })
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
    // PreluДѓm valoarea TRIM
    var trimValue = 0;
    if (!isNaN(Number(values['TRIM']))) {
        trimValue = Number(values['TRIM']);
    }

    // Definim cГўmpurile din Capitolul II
    var fields = [
        'CAP2_R10_', 'CAP2_R20_', 'CAP2_R30_', 'CAP2_R40_', 'CAP2_R50_',
        'CAP2_R60_', 'CAP2_R70_', 'CAP2_R80_', 'CAP2_R90_', 'CAP2_R100_',
        'CAP2_R110_', 'CAP2_R120_', 'CAP2_R160_'
    ];

    // VariabilДѓ pentru a aduna valorile И™i pentru a colecta cГўmpurile cu date
    var cap2Sum = 0;
    var errors = [];

    // IterДѓm prin toate rГўndurile И™i coloanele din Cap2 pentru a aduna valorile И™i a colecta cГўmpurile care au date
    for (var i = 0; i < fields.length; i++) {
        for (var j = 1; j <= 12; j++) {
            var fieldName = fields[i] + 'C' + j;
            var cellValue = parseFloat(values[fieldName]);
            if (!isNaN(cellValue) && cellValue > 0) {
                cap2Sum += cellValue;

                // AdaugДѓ eroare pentru fiecare cГўmp specific dacДѓ TRIM nu este 3
                if (trimValue != 3) {
                    errors.push({
                        'fieldName': fieldName,
                        'weight': 1,
                        'msg': Drupal.t('Eroare: Capitolul II conИ›ine date Г®n cГўmpul [@fieldName] (valoare: @cellValue), dar TRIM nu este egal cu 3. VДѓ rugДѓm sДѓ corectaИ›i.', {
                            '@fieldName': fieldName,
                            '@cellValue': cellValue
                        })
                    });
                }
            }
        }
    }

    // ReturnДѓm toate erorile dacДѓ existДѓ
    if (errors.length > 0) {
        return errors;
    }

    return null; // Nicio eroare
}

function validateCAEM2(values) {
    // PreluДѓm valoarea TRIM
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

    // IterДѓm prin cГўmpurile CAEM pentru a verifica dacДѓ sunt completate
    for (var i = 0; i < caemFields.length; i++) {
        var caemField = values[caemFields[i]]; // CAEM specific coloanei

        // VerificДѓm dacДѓ CAEM este completat
        if (caemField && caemField !== '') {
            caem2HasData = true;

            // DacДѓ TRIM nu este 3 И™i CAEM este completat, afiИ™Дѓm eroare
            if (trimValue != 3) {
                errors.push({
                    'fieldName': caemFields[i],
                    'weight': 1,
                    'msg': Drupal.t('Eroare: CГўmpul [@fieldName] (genul de activitate) este completat, dar TRIM nu este egal cu 3. VДѓ rugДѓm sДѓ corectaИ›i.', {
                        '@fieldName': caemFields[i]
                    })
                });
            }
        }
    }

    // ReturnДѓm erorile, dacДѓ existДѓ
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
            'msg': Drupal.t(`Cod eroare: A.014 Cod CAEM (${caem}) trebuie sa fie acelasi ca si in Activitatea principalДѓ (${cap1_caem_c2_value})`)
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