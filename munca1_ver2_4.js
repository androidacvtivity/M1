(function ($) {

    var activity_options_default_value = '';
    var caem_sorted = false;

    Drupal.behaviors.munca1 = {
        attach: function (context, settings) {
            if (!Drupal.settings.mywebform.preview) {
                attr_caem('dec_caem_c', 2, 12);
            }

            jQuery('input.float').keypress(function (event) {
                return validateFloatKeyPress(this, event);
            });

            jQuery('input.numeric').keypress(function (event) {
                return validateFloatKeyPressNumeric(this, event);
            });
        }
    }

    function isNumberKey(evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode < 48 || charCode > 57) {
            return false;
        }
        return true;
    }

    function validateFloatKeyPress(el, evt) {
        var charCode = (evt.which) ? evt.which : event.keyCode;
        var number = el.value.split('.');
        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        //just one dot
        if (number.length > 1 && charCode == 46) {
            return false;
        }
        //get the carat position
        var caratPos = getSelectionStart(el);
        var dotPos = el.value.indexOf(".");
        if (caratPos > dotPos && dotPos > -1 && (number[1].length > 0)) {
            return false;
        }
        return true;
    }

    //thanks: http://javascript.nwbox.com/cursor_position/
    function getSelectionStart(o) {
        if (o.createTextRange) {
            var r = document.selection.createRange().duplicate()
            r.moveEnd('character', o.value.length)
            if (r.text == '') return o.value.length
            return o.value.lastIndexOf(r.text)
        } else return o.selectionStart
    }

    function validateFloatKeyPressNumeric(el, evt) {
        var charCode = (evt.which) ? evt.which : event.keyCode
        if (charCode > 31 && (charCode < 48 || charCode > 57))
            return false;
        return true;
    }

    webform.afterLoad.munca1_changeYear = function () {
        activity_options_default_value = (typeof Drupal.settings.mywebform.values.dec_fiscCod_caem != "undefined" ? Drupal.settings.mywebform.values.dec_fiscCod_caem : '');
        if (!Drupal.settings.mywebform.preview) {
            year_on_change_action();
        }
    }

    function attr_caem(selector, startNumber, endNumber) {
        if (!Drupal.settings.mywebform.preview) {
            if (!caem_sorted && typeof caem === 'object') {
                var caemArray = [];
                for (var x in caem) {
                    caemArray.push(caem[x]);
                }
                caem = caemArray;

                caem.sort(function (a, b) {
                    var nameA = a.code + a.description;
                    var nameB = b.code + b.description;

                    if (nameA < nameB) {
                        return -1;
                    } else if (nameA > nameB) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                caem_sorted = true;
            }

            for (var i = startNumber; i <= endNumber; i++) {
                var field_name = selector + i;
                var obj = jQuery('#' + field_name);
                var valueSelected = Drupal.settings.mywebform.values[field_name];
                var options = [];

                options.push({
                    'id': '',
                    'text': ''
                });
                jQuery.each(caem, function (key, value) {
                    options.push({
                        'id': value.code + value.description,
                        'text': value.code + value.description + ',' + value.name
                    });
                });

                Drupal.settings.mywebform.fields[field_name].options = options;
                obj.myWebformSelect2SetVal(valueSelected);
            }
        }
    }

    webform.afterLoad.bns_split_tables = function () {
        if (Drupal.settings.mywebform.preview) {
            if (typeof (split_tables) == "function") {
                split_tables();
            }
        }
    }
})(jQuery)

webform.validators.munca1 = function (v, allowOverpass) {
    var values = Drupal.settings.mywebform.values;
    var arr1_in = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    var arrL = ['10', '20', '30', '31', '40', '50', '51', '52', '60', '70', '71', '72', '73', '74', '110'];
    var valid_ = 0;
    for (var j = 0; j < arr1_in.length; j++) {
        for (var l = 0; l < arrL.length; l++) {
            if (!isNaN(parseFloat(values['dec_table_row_r' + arrL[l] + 'c' + arr1_in[j]]))) {
                valid_ = 1;
            }
        }
    }

    for (var h = 2; h < 13; h++) {
        var fields_caem3 = jQuery('#tab_con tbody tr td:nth-child(' + h + ')').find('select').val();
        for (var m = 2; m < 13; m++) {
            if (h != m) {
                var fields_caem4 = jQuery('#tab_con tbody tr td:nth-child(' + m + ')').find('select').val();
                if (fields_caem4 == fields_caem3 && fields_caem4 !== '') {
                    webform.errors.push({
                        'fieldName': 'dec_caem_c' + m,
                        'weight': 31,
                        'msg': Drupal.t('Cod eroare: 05-031 (Cap.1). Cod CAEM nu trebuie sa se repete')
                    });
                }
            }
        }
    }

    if (valid_ == 1) {
        var arr1_inputs = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

        for (var i = 0; i < arr1_inputs.length; i++) {
            var fields_caem2 = jQuery('#tab_con tbody tr td:nth-child(' + arr1_inputs[i] + ')').find('select').val();
            var caem2 = jQuery(fields_caem2).val();
           
           
            var col10 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r10c' + arr1_inputs[i]]))) {
                col10 = parseFloat(values['dec_table_row_r10c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r10c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM'),
                    });
                }
            }
            



            
            var col20 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r20c' + arr1_inputs[i]]))) {
                col20 = parseFloat(values['dec_table_row_r20c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r20c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }


//Cod eroare: 05-050 (Cap.1). Rind 10 <> rind 20

            if (col10 !== col20) {

                webform.errors.push({
                    'fieldName': 'dec_table_row_r20c' + arr1_inputs[i],
                    'weight': 73,
                    'msg': Drupal.t('Cod eroare: 05-050 (Cap.1). Rind 10 <> rind 20')
                });


            }
//Cod eroare: 05-050 (Cap.1). Rind 10 <> rind 20


            var col30 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r30c' + arr1_inputs[i]]))) {
                col30 = parseFloat(values['dec_table_row_r30c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r30c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }




            var col31 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r31c' + arr1_inputs[i]]))) {
                col31 = parseFloat(values['dec_table_row_r31c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r31c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }

            var col40 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r40c' + arr1_inputs[i]]))) {
                col40 = parseFloat(values['dec_table_row_r40c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r40c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }

            var col50 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r50c' + arr1_inputs[i]]))) {
                col50 = parseFloat(values['dec_table_row_r50c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r50c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }
            var col51 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r51c' + arr1_inputs[i]]))) {
                col51 = parseFloat(values['dec_table_row_r51c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r51c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }
            var col52 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r52c' + arr1_inputs[i]]))) {
                col52 = parseFloat(values['dec_table_row_r52c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r52c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }
            var col60 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r60c' + arr1_inputs[i]]))) {
                col60 = parseFloat(values['dec_table_row_r60c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r60c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }
            
            
            var col70 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r70c' + arr1_inputs[i]]))) {
                col70 = parseFloat(values['dec_table_row_r70c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r70c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }

            var col71 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r71c' + arr1_inputs[i]]))) {
                col71 = parseFloat(values['dec_table_row_r71c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r71c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }


            if (col70 < col71) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r71c' + arr1_inputs[i],
                    'weight': 3,
                    'msg': Drupal.t('Cod eroare: 05-003 (Cap.1). Rind 71 <= rind 70')
                });
            }




            var col72 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r72c' + arr1_inputs[i]]))) {
                col72 = parseFloat(values['dec_table_row_r72c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r72c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }

            if (col70 < col72) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r72c' + arr1_inputs[i],
                    'weight': 4,
                    'msg': Drupal.t('Cod eroare: 05-004 (Cap.1). Rind 72 <= rind 70')
                });
            }

            var col73 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r73c' + arr1_inputs[i]]))) {
                col73 = parseFloat(values['dec_table_row_r73c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r73c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }
            var col74 = 0;
            if (!isNaN(parseFloat(values['dec_table_row_r74c' + arr1_inputs[i]]))) {
                col74 = parseFloat(values['dec_table_row_r74c' + arr1_inputs[i]]);
                if (fields_caem2 == '') {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r74c' + arr1_inputs[i],
                        'weight': 21,
                        'msg': Drupal.t('Cod eroare: 05-021 (Cap.1). Pentru orice Col. cu date exista Cod. CAEM')
                    });
                }
            }

//Rind.70≠Rind.71+Rind.73+Rind.74

            if (col70 !== col71 + col73 + col74) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r70c' + arr1_inputs[i],
                    'weight': 74,
                    'msg': Drupal.t('Cod eroare:05-051 Rind.70≠Rind.71+Rind.73+Rind.74')
                });
            }

//Rind.70≠Rind.71+Rind.73+Rind.74

            if (col50 > 0 && col30 == 0) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r30c' + arr1_inputs[i],
                    'weight': 23,
                    'msg': Drupal.t('Cod eroare: 05-023 Atentionare (Cap.1). Daca exista Rind.30 trebuie sa fie si Rind.50')
                });
            }
            if (col30 > 0 && col50 == 0) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r30c' + arr1_inputs[i],
                    'weight': 23,
                    'msg': Drupal.t('Cod eroare: 05-023 Atentionare (Cap.1). Daca exista Rind.50 trebuie sa fie si Rind.30')
                });
            }
            if (col70 < col73) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r73c' + arr1_inputs[i],
                    'weight': 5,
                    'msg': Drupal.t('Cod eroare: 05-005 (Cap.1). Rind 73 <= rind 70')
                });
            }
            if (col70 < col74) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r74c' + arr1_inputs[i],
                    'weight': 6,
                    'msg': Drupal.t('Cod eroare: 05-006 (Cap.1). Rind 74 <= rind 70')
                });
            }
            
            
            if (col70 < col71 + col72 + col73 + col74) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r70c' + arr1_inputs[i],
                    'weight': 7,
                    'msg': Drupal.t('Cod eroare: 05-007 Atentionare (Cap.1). Suma rinduri(71,72,73,74) <= rind 70')
                });
            }


            
            
            if (col20 > col10) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r20c' + arr1_inputs[i],
                    'weight': 9,
                    'msg': Drupal.t('Cod eroare: 05-009 Atentionare (Cap.1). Rind 20 <= rind 10')
                });
            }





            if (col40 > col30) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r40c' + arr1_inputs[i],
                    'weight': 10,
                    'msg': Drupal.t('Cod eroare: 05-010 Atentionare (Cap.1). Rind 40 <= rind 30')
                });
            }

            var raport = col30 + col40;
            if (raport > 0) {
                var calcul = (col50 * 1000) / raport;
                calcul = calcul.toFixed(1);
                if (calcul > 570 || calcul < 450) {
                    webform.warnings.push({
                        'fieldName': 'dec_table_row_r50c' + arr1_inputs[i],
                        'weight': 12,
                        'msg': Drupal.t('Cod eroare: 05-012 Atentionare (Cap.1). Rind 50*1000/ sum(rind 30+rind 40) <= 570 si > 420  (@sum)', {
                            '@sum': calcul
                        })
                    });
                }
            }

            if (col30 > 0 && col70 == 0) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r50c' + arr1_inputs[i],
                    'weight': 13,
                    'msg': Drupal.t('Cod eroare: 05-013 Atentionare (Cap.1). Daca exista rindul 30 trebuie sa fie si rindul 70')
                });
            }
            if (col70 > 0 && col30 == 0) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r50c' + arr1_inputs[i],
                    'weight': 13,
                    'msg': Drupal.t('Cod eroare: 05-013 Atentionare (Cap.1). Daca exista rindul 70 trebuie sa fie si rindul 30')
                });
            }

            if (col40 > 0 && col73 == 0) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r73c' + arr1_inputs[i],
                    'weight': 30,
                    'msg': Drupal.t('Cod eroare: 05-030 (Cap.1). Daca exista rindul 40 trebuie sa fie si rindul 73')
                });
            }
            if (col73 > 0 && col40 == 0) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r40c' + arr1_inputs[i],
                    'weight': 30,
                    'msg': Drupal.t('Cod eroare: 05-030 (Cap.1). Daca exista rindul 73 trebuie sa fie si rindul 40')
                });
            }
            if (col10 > 0 && col30 == 0) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r30c' + arr1_inputs[i],
                    'weight': 40,
                    'msg': Drupal.t('Cod eroare: 05-040 (Cap.1). Daca este Rind.10 atunci trebuie sa fie si Rind.30 pe toate coloanele.')
                });
            }
            if (!isNaN(parseFloat(values['dec_table_row_r50c' + arr1_inputs[i]])) || !isNaN(parseFloat(values['dec_table_row_r51c' + arr1_inputs[i]]))) {
                if (col51 <= col52 && (col51 > 0 || col52 > 0)) {
                    webform.errors.push({
                        'fieldName': 'dec_table_row_r51c' + arr1_inputs[i],
                        'weight': 42,
                        'msg': Drupal.t('Cod eroare: 05-042 (Cap.1). Rind 51 Cap.I > Rind 52 Cap.I')
                    });
                }
            }

            if ((col40 > 0 && col30 === 0) && col70 !== col73) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r70c' + arr1_inputs[i],
                    'weight': 43,
                    'msg': Drupal.t('Cod eroare: 05-043 Atentionare (Cap.1). Daca Rind.40 > 0 si Rind.30 = 0, atunci Rind.70 = Rind.73 și invers')
                });
            }

            if ((col70 === col73 && col40 === 0) || (col70 === col73 && col30 > 0)) {
                if (col70 !== 0) {
                    webform.warnings.push({
                        'fieldName': 'dec_table_row_r70c' + arr1_inputs[i],
                        'weight': 43,
                        'msg': Drupal.t('Cod eroare: 05-043 Atentionare (Cap.1). Daca Rind.70 = Rind.73, atunci Rind.40 > 0 si Rind.30 = 0 și invers')
                    });
                }
            }

            var SumF = col30 - col31;

            if (SumF !== 0) {
                var calcul2 = ((col70 - col74) * 1000 / (col30 - col31)) / 3;
                calcul2 = calcul2.toFixed(1);
                if (calcul2 <= 2000) {
                    webform.warnings.push({
                        'fieldName': 'dec_table_row_r70c' + arr1_inputs[i],
                        'weight': 44,
                        'msg': Drupal.t('Cod eroare: 05-044 Atentionare (Cap.1). ((Rind.70 - Rind.74) * 1000 / (Rind.30 - Rind.31))/3  > 1000, valoarea = @sum', {
                            '@sum': calcul2
                        })
                    });
                }
            }

            if (col30 > 0) {
                var calcul3 = ((col70 - col73) * 1000 / (col30)) / 3;
                calcul3 = calcul3.toFixed(1);
                if ((calcul3 <= 4000) || (calcul3 >= 15000)) {
                    webform.warnings.push({
                        'fieldName': 'dec_table_row_r70c' + arr1_inputs[i],
                        'weight': 36,
                        'msg': Drupal.t('Cod eroare: 05-036 Atentionare (Cap.1). (Rind.70 - Rind.73) * 1000 / Rind.30 /3  > 2000, si < 10000 valoarea = @sum', {
                            '@sum': calcul3
                        })
                    });
                }
            }

            if (col31 > col30) {
                webform.errors.push({
                    'fieldName': 'dec_table_row_r31c' + arr1_inputs[i],
                    'weight': 14,
                    'msg': Drupal.t('Cod eroare: 05-014 (Cap.1). Rind 31 <= rind 30')
                });
            }

            if (col31 > 0) {
                var calcul1 = ((col74 * 1000) / (col31)) / 3;
                calcul1 = calcul1.toFixed(1);
                if ((calcul1 >= 15000) || (calcul1 <= 6000)) {
                    webform.warnings.push({
                        'fieldName': 'dec_table_row_r74c' + arr1_inputs[i],
                        'weight': 37,
                        'msg': Drupal.t('Cod eroare: 05-037 Atentionare (Cap.1). (Rind.74 * 1000 / Rind.31)/3 >3000 si <10000, valoarea = @sum', {
                            '@sum': calcul1
                        })
                    });
                }
            }

            if (col40 > 0) {
                var calcul4 = ((col73 * 1000) / (col40)) / 3;
                calcul4 = calcul4.toFixed(1);
                if ((calcul4 >= 15000) || (calcul4 <= 4000)) {
                    webform.warnings.push({
                        'fieldName': 'dec_table_row_r73c' + arr1_inputs[i],
                        'weight': 39,
                        'msg': Drupal.t('Cod eroare: 05-039 Atentionare (Cap.1). (Rind.73 * 1000 / Rind.40)/3 > 2000 si <10000, valoarea = @sum', {
                            '@sum': calcul4
                        })
                    });
                }
            }

            if (col31 > 0 && col74 == 0) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r74c' + arr1_inputs[i],
                    'weight': 25,
                    'msg': Drupal.t('Cod eroare: 05-025 Atentionare (Cap.1).  Daca exista rindul 31 trebuie sa fie si rindul 74')
                });
            }
            if (col74 > 0 && col31 == 0) {
                webform.warnings.push({
                    'fieldName': 'dec_table_row_r31c' + arr1_inputs[i],
                    'weight': 25,
                    'msg': Drupal.t('Cod eroare: 05-025 Atentionare (Cap.1). Daca exista rindul 74 trebuie sa fie si rindul 31')
                });
            }
        }

        var rd70_1 = 0;
        if (!isNaN(parseFloat(values['dec_table_row_r70c1']))) {
            rd70_1 = parseFloat(values['dec_table_row_r70c1']);
        }
        var rd70_2 = 0;
        if (!isNaN(parseFloat(values['dec_table_row_r70c2']))) {
            rd70_2 = parseFloat(values['dec_table_row_r70c2']);
        }

        if (rd70_1 > 0 && rd70_2 == 0) {
            webform.warnings.push({
                'fieldName': 'dec_table_row_r70c2',
                'weight': 22,
                'msg': Drupal.t('Cod eroare: 05-022 Atentionare (Cap.1). Daca este Col.1 trebuie sa fie Col.2 Rind.70')
            });
        }
        var rd30_1 = 0;
        if (!isNaN(parseFloat(values['dec_table_row_r30c1']))) {
            rd30_1 = parseFloat(values['dec_table_row_r30c1']);
        }
        var rd10_1 = 0;
        if (!isNaN(parseFloat(values['dec_table_row_r10c1']))) {
            rd10_1 = parseFloat(values['dec_table_row_r10c1']);
        }

        var rd30_2 = 0;
        if (!isNaN(parseFloat(values['dec_table_row_r30c2']))) {
            rd30_2 = parseFloat(values['dec_table_row_r30c2']);
        }

        if (rd30_1 > 0 && rd30_2 == 0) {
            webform.warnings.push({
                'fieldName': 'dec_table_row_r30c2',
                'weight': 22,
                'msg': Drupal.t('Cod eroare: 05-022 Atentionare (Cap.1). Daca este Col.1 trebuie sa fie Col.2 Rind.30')
            });
        }
        if (rd30_1 > rd10_1) {
            webform.warnings.push({
                'fieldName': 'dec_table_row_r30c1',
                'weight': 28,
                'msg': Drupal.t('Cod eroare: 05-028 Atentionare (Cap.1). Col.1 Rind.30 <= Rind.10')
            });
        }
    }

    for (var k = 2; k < 13; k++) {
        fields_caem1 = jQuery('#tab_con tbody tr td:nth-child(' + k + ')').find('select').val();

        var select_normal_caem = function () {
            if (
                (fields_caem1.substring(0, 3) == 'Q86') ||
                (fields_caem1.substring(0, 3) == 'Q87') ||
                (fields_caem1.substring(0, 5) == 'P8510') ||
                (fields_caem1.substring(0, 5) == 'P8520') ||
                (fields_caem1.substring(0, 5) == 'P8531') ||
                (fields_caem1.substring(0, 5) == 'P8532') ||
                (fields_caem1.substring(0, 5) == 'P8541') ||
                (fields_caem1.substring(0, 5) == 'P8542') ||
                (fields_caem1.substring(0, 5) == 'P8551') ||
                (fields_caem1.substring(0, 5) == 'P8552')
            ) {
                return true;
            } else {
                return false;
            }
        }();

        //Error 15-024
        if (fields_caem1 !== '' && k == 2) {

            if (values['dec_table_row_r31c' + k] == '' && select_normal_caem) {

                warnings_push_r31c_024_principal(k);

            } else if (values['dec_table_row_r31c' + k] != '') {

                field_r31_full_error_024(k);
            }

            if (values['dec_table_row_r74c' + k] == '' && select_normal_caem) {

                warnings_push_r74c_024_principal(k);
            } else if (values['dec_table_row_r74c' + k] != '') {

                field_r74_full_error_024(k);
            }
        }

        //Error 15-015
        if (fields_caem1 !== '' && k > 2) {

            if (values['dec_table_row_r31c' + k] == '' && select_normal_caem) {

                warnings_push_r31c_015_secondary(k);
            } else if (values['dec_table_row_r31c' + k] != '') {

                field_r31_full_error_015(k);
            }


            if (values['dec_table_row_r74c' + k] == '' && select_normal_caem) {

                warnings_push_r74c_015_secondary(k);

            } else if (values['dec_table_row_r74c' + k] != '') {

                field_r74_full_error_015(k);
            }
        }
    }

    // error 05-024
    function field_r31_full_error_024(k) {

        if ((fields_caem1.substring(0, 5) == 'P8553') || (fields_caem1.substring(0, 5) == 'P8559') || (fields_caem1.substring(0, 5) == 'P8560')) {

            warnings_push_r31c_024_principal(k);

        } else if (select_normal_caem) {

        } else {
            warnings_push_r31c_024_principal(k);
        }

    }

    function field_r74_full_error_024(k) {
        if ((fields_caem1.substring(0, 5) == 'P8553') || (fields_caem1.substring(0, 5) == 'P8559') || (fields_caem1.substring(0, 5) == 'P8560')) {

            warnings_push_r74c_024_principal(k);
        } else if (select_normal_caem) {

        } else {
            warnings_push_r74c_024_principal(k);
        }
    }

    //error 05-015
    function field_r31_full_error_015(k) {

        if ((fields_caem1.substring(0, 4) == 'P856') || (fields_caem1.substring(0, 5) == 'P8553') || (fields_caem1.substring(0, 5) == 'P8559')) {

            warnings_push_r31c_015_secondary(k);

        } else if (select_normal_caem) {

        } else {
            warnings_push_r31c_015_secondary(k);
        }
    }


    function field_r74_full_error_015(k) {

        if ((fields_caem1.substring(0, 4) == 'P856') || (fields_caem1.substring(0, 5) == 'P8553') || (fields_caem1.substring(0, 5) == 'P8559')) {

            warnings_push_r74c_015_secondary(k);
        } else if (select_normal_caem) {

        } else {
            warnings_push_r74c_015_secondary(k);
        }
    }


    function warnings_push_r31c_024_principal(k) {
        webform.warnings.push({
            'fieldName': 'dec_table_row_r31c' + k,
            'weight': 24,
            'msg': Drupal.t('Cod eroare: 05-024 Atentionare (Cap.1). Rind 31  se introduce, daca Activitatea Principala CAEM = {Q86,Q87,P85}, in afara de P856, P8553 si P8559')
        });
    }

    function warnings_push_r74c_024_principal(k) {
        webform.warnings.push({
            'fieldName': 'dec_table_row_r74c' + k,
            'weight': 24,
            'msg': Drupal.t('Cod eroare: 05-024 Atentionare (Cap.1). Rind 74  se introduce, daca Activitatea Principala CAEM = {Q86,Q87,P85}, in afara de P856, P8553 si P8559')
        });
    }

    function warnings_push_r31c_015_secondary(k) {
        webform.warnings.push({
            'fieldName': 'dec_table_row_r31c' + k,
            'weight': 15,
            'msg': Drupal.t('Cod eroare: 05-015 Atentionare (Cap.1). Rind 31  se introduce, daca Activitatea Secundara CAEM = {Q86,Q87,P85}, in afara de P856, P8553 si P8559')
        });
    }

    function warnings_push_r74c_015_secondary(k) {
        webform.warnings.push({
            'fieldName': 'dec_table_row_r74c' + k,
            'weight': 15,
            'msg': Drupal.t('Cod eroare: 05-015 Atentionare (Cap.1). Rind 74  se introduce, daca Activitatea Secundara CAEM = {Q86,Q87,P85}, in afara de P856, P8553 si P8559')
        });
    }

    var trimestrial = Drupal.settings.mywebform.values.nalogPeriodQuarter;
    var year = Drupal.settings.mywebform.values.nalogPeriodYear;
    if (parseFloat(trimestrial) == get_trimestrial() && year == get_current_year()) {
        webform.errors.push({
            'fieldName': 'nalogPeriodType',
            'msg': Drupal.t('Wrong fiscal period!')
        });
    }

    if (!values.dec_group2_adres) {
        webform.warnings.push({
            "fieldName": "dec_group2_adres",
            "msg": Drupal.t('Câmpul nu este completat')
        });
    }

    //Sort warnings & errors
    webform.warnings.sort(function (a, b) {
        return sort_errors_warinings(a, b);
    });

    webform.errors.sort(function (a, b) {
        return sort_errors_warinings(a, b);
    });

    webform.validatorsStatus['munca1'] = 1;
    validateWebform();
};

function get_trimestrial() {
    var date = new Date();
    return Math.ceil((date.getMonth() + 1) / 3);
}

function get_current_year() {
    var date = new Date();
    return date.getFullYear();
}

function sort_errors_warinings(a, b) {
    if (!a.hasOwnProperty('weight')) {
        a.error_code = 9999;
    }

    if (!b.hasOwnProperty('weight')) {
        b.error_code = 9999;
    }

    return toFloat(a.error_code) - toFloat(b.error_code);
}
