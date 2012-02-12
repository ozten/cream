var format = require('util').format;
/**
 * Given 1000 returns "$10.00"
 */
exports.format_money = function (amount) {
  var dollars = Math.floor(amount / 100),
      cents,
      sign = "";
  if (amount < 0) {
    sign = "- ";
  }
  if (amount % 100 < 10) {
    cents = '0' + (amount % 100);
  } else {
    cents = new String(amount % 100);
  }
  return format("%s$%d.%s", sign, dollars, cents);
};