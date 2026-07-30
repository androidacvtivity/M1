/*
 * M1 - modificări Capitolul II pentru trimestrul III 2026.
 *
 * Acest fișier se încarcă DUPĂ M1_0469.js.
 * Păstrează toate validările existente și înlocuiește regulile 07-009,
 * 07-016 și 07-018 conform sarcinii tehnice:
 *   - salariul minim: 6300 lei;
 *   - rândul 50 este eliminat din calcul;
 *   - intervalele rândurilor 20, 30 și 40 sunt actualizate.
 */
(function () {
    'use strict';

    if (typeof webform === 'undefined' ||
        !webform.validators ||
        typeof webform.validators.m1 !== 'function' ||
        webform.validators.m1.__cap2_2026_modified) {
        return;
    }

    var originalM1Validator = webform.validators.m1;

    function toNumber(value) {
        var number = parseFloat(value);
        return isNaN(number) ? 0 : number;
    }

    function roundToDecimal(value, decimals) {
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    function removeValidationByCode(collection, codes) {
        if (!Array.isArray(collection)) {
            return;
        }

        for (var i = collection.length - 1; i >= 0; i--) {
            var message = collection[i] && collection[i].msg
                ? String(collection[i].msg)
                : '';

            for (var j = 0; j < codes.length; j++) {
                if (message.indexOf(codes[j]) !== -1) {
                    collection.splice(i, 1);
                    break;
                }
            }
        }
    }

    function getValues() {
        if (typeof Drupal !== 'undefined' &&
            Drupal.settings &&
            Drupal.settings.mywebform &&
            Drupal.settings.mywebform.values) {
            return Drupal.settings.mywebform.values;
        }

        if (typeof drupalSettings !== 'undefined' &&
            drupalSettings.mywebform &&
            drupalSettings.mywebform.values) {
            return drupalSettings.mywebform.values;
        }

        return {};
    }

    function addCap2Validations2026(values) {
        var columns = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            var row = function (rowNumber) {
                return toNumber(values['CAP2_R' + rowNumber + '_C' + column]);
            };

            var CAP2_R10 = row('10');
            var CAP2_R20 = row('20');
            var CAP2_R30 = row('30');
            var CAP2_R40 = row('40');
            var CAP2_R60 = row('60');
            var CAP2_R70 = row('70');
            var CAP2_R80 = row('80');
            var CAP2_R90 = row('90');
            var CAP2_R100 = row('100');
            var CAP2_R110 = row('110');
            var CAP2_R120 = row('120');
            var CAP2_R160 = row('160');

            // 07-009 - verificarea valorii minime și maxime.
            // Rândul 50 este eliminat din calcul.
            if (CAP2_R10 > 0) {
                var minCAP2R160 = (
                    0 * CAP2_R20 +
                    6300 * CAP2_R30 +
                    6300 * CAP2_R40 +
                    7000 * CAP2_R60 +
                    8000 * CAP2_R70 +
                    10000 * CAP2_R80 +
                    15000 * CAP2_R90 +
                    20000 * CAP2_R100 +
                    25000 * CAP2_R110 +
                    30000 * CAP2_R120
                ) / 1000;

                var maxCAP2R160 = (
                    6300 * CAP2_R20 +
                    6300 * CAP2_R30 +
                    7000 * CAP2_R40 +
                    8000 * CAP2_R60 +
                    10000 * CAP2_R70 +
                    15000 * CAP2_R80 +
                    20000 * CAP2_R90 +
                    25000 * CAP2_R100 +
                    30000 * CAP2_R110 +
                    40000 * CAP2_R120
                ) / 1000;

                minCAP2R160 = roundToDecimal(minCAP2R160, 1);
                maxCAP2R160 = roundToDecimal(maxCAP2R160, 1);

                if (CAP2_R160 < minCAP2R160 || CAP2_R160 > maxCAP2R160) {
                    webform.warnings.push({
                        'fieldName': 'CAP2_R160_C' + column,
                        'weight': 9,
                        'msg': Drupal.t(
                            'Cod atenționare: 07-009 - Cap.2: Verificarea la minimum și maximum. -> Cap.2 R.160 = [@CAP2_R160], minim = [@min_CAP2_R160] și maxim = [@max_CAP2_R160]',
                            {
                                '@CAP2_R160': CAP2_R160,
                                '@min_CAP2_R160': minCAP2R160,
                                '@max_CAP2_R160': maxCAP2R160
                            }
                        )
                    });
                }
            }

            // 07-016 - valoarea maximă atunci când R.120 lipsește.
            // Rândul 50 este eliminat din calcul.
            if (CAP2_R120 === 0 && CAP2_R10 > 0) {
                var maxWithoutR120 = (
                    6300 * CAP2_R20 +
                    6300 * CAP2_R30 +
                    7000 * CAP2_R40 +
                    8000 * CAP2_R60 +
                    10000 * CAP2_R70 +
                    15000 * CAP2_R80 +
                    20000 * CAP2_R90 +
                    25000 * CAP2_R100 +
                    30000 * CAP2_R110
                ) / 1000;

                maxWithoutR120 = roundToDecimal(maxWithoutR120, 1);

                if (CAP2_R160 > maxWithoutR120) {
                    webform.errors.push({
                        'fieldName': 'CAP2_R160_C' + column,
                        'weight': 16,
                        'msg': Drupal.t(
                            'Cod eroare: 07-016 - Cap.2: Verificarea la maximum dacă lipsește R.120 -> Cap.2 R.160 = [@CAP2_R160], maxim = [@max_CAP2_R160]',
                            {
                                '@CAP2_R160': CAP2_R160,
                                '@max_CAP2_R160': maxWithoutR120
                            }
                        )
                    });
                }
            }

            // 07-018 - salariul minim pentru anul 2026 este 6300 lei.
            if (CAP2_R20 > 0) {
                webform.warnings.push({
                    'fieldName': 'CAP2_R10_C' + column,
                    'weight': 18,
                    'msg': Drupal.t(
                        'Cod atenționare: 07-018 - Cap.2: Asigurați-vă de corectitudinea datelor. Salariul minim = 6300 lei. -> [@CAP2_R20]',
                        { '@CAP2_R20': CAP2_R20 }
                    )
                });
            }
        }
    }

    webform.validators.m1 = function (v, allowOverpass) {
        originalM1Validator(v, allowOverpass);

        // Eliminăm rezultatele regulilor vechi (5500 lei), apoi aplicăm formulele noi.
        removeValidationByCode(webform.errors, ['07-009', '07-016', '07-018']);
        removeValidationByCode(webform.warnings, ['07-009', '07-016', '07-018']);

        addCap2Validations2026(getValues());
    };

    webform.validators.m1.__cap2_2026_modified = true;
})();
