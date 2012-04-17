Pay Specification

## Terms: ##

- ** Customer ** - The party purchasing a good or service. They will make a payment.
- ** Merchant ** - The party selling a good or service. They will recieve a payment.
- ** Payment Processor ** - The party collecting payment on behalf of the merchant. They support one or more payment types.
- ** Payment Method ** - A Payment Type and Personal Account Number stored in a Customer's Wallet.
- ** Payment Type ** - A type of digital currency. Examples: VISA, MasterCard, ACH, IOU, Dwolla.
- ** Personal Account Number ** - Public and Private identifiers for giving or recieving payments.
- ** Persona Wallet ** - Browser based collection of Payment Methods.

_Note:_ Customers can be merchants and merchants can be customers, due to the generative nature of
Persona Wallet, but this is a fixed role within a single transaction.

## `navigator.id.pay` ##

A Merchant Website requests payment from a customer via a JavaScript API.

A new DOM function is provided via the LIFD pattern, to polyfill User Agents which lack this new
DOM feature.

Merchant websites should include

    <script src="https://wallet.persona.org/include.js"></script>
    <script>
    ...
    navigator.id.pay(amounts, accepted_pay_types, customer_email, merchant_email,
        callback(err, receipt) {
          if (err) {

          } else {
                verify_reciept_serverside(receipt);
          }
        },
        options);

TBD: We can use a parameter object instead of 6 parameters

### Required Parameters ###
- ** amounts ** - A list of strings, each string is an integer amount followed by a space followed by a currency code.

    For currencies that allow fractions, this will a whole number representation. Standardization is per
payment type, driven by that community.

    #### Example Amounts ####

    * $10 USD would be formatted as '1000 USD'.
    * E9.99 would be formatted as '999 EU'
    * 213.495 Bitcoins would be '213495 BTC'
    * 4 Dowallas (a integer only currency) would be '4 DW'

    Multiple amounts are allowed, to alleviate the need for currency exchange rate calculation.

        navigator.id.pay(['120 EU', '200 USD'], ['VISA', 'MASTERCARD'])

    _TODO:_ Supporting multiple currencies makes this very complicated, pushing this into the RP is probably better?

- ** accepted_payment_types ** - A list of objects, each object has keys which are payment types codes and the values are payment processor domains. The domain is where the payment processor will accept payment.

    #### Example ####
    var accepted_pay_types = {
        "VISA": "authorize.net",
        "MASTERCARD": "authorize.net",
        "PAYPAL": "paypal.com",
        "DWOLLA": "dowalla.com"
    }

    Recognized Payment Types:
    * VISA * MASTERCARD * AMEX * ACH * PAYPAL * DWOLLA * FACEBOOK * PAYSWARM * BITCOIN
    * MPESA *... etc

    _**Note:**_ A payment type will have 1 or more payment processors. VISA provides many PP, DWolla may only have one payment processor (Dwolla itself).

    User Agents MAY attempt generic support for unknown payment types, but SHOULD create easily understood user iterfaces around supported payment types.

    User Agents MAY support a subset of Recognized Payment Types

    The importance of the payment processor domain will be explained below in section "Payment Transaction".

- ** customer_email ** - A verified email address from the customer. The customer's wallet will be unlocked with this address. Merchant SHOULD use the primary email address in the current session.

- ** merchant_email ** - A verified email address from the merchant. The payment will be routed to the wallet associated with this address.

- ** callback ** - A function which takes two arguments, error and receipt. If there is a payment error during the transaction, reciept will be ``null`` and error will be one of the following codes:

    * USER_DENIED_TRANSACTION - User canceled initial dialog
    * NETWORK_ERROR
    * INSUFFICIENT_FUNDS
    * NO_MATCHING_PAYMENT_TYPES
    * MERCHANT_UNKNOWN
    * UNKNOWN_ERROR

    Merchants SHOULD treat unknown error codes as ``UNKNOWN_ERROR``.

    If there are no errors, error will be set to ``null`` and the receipt object will be a signed JSON Web Token (JWT) with the following properties:

    * transaction_date
    * amount
    * payment_type
    * payment_processor
    * customer_email
    * merchant_email

### Options ###

- ** description ** - A 255 character or less string describing the purchase.

## The User's Wallet ##

The pay function causes the User Agent to display the user's wallet. The user may choose to pay the merchant or denie the request.

The UA SHOULD display the payment options, the user's Personal Account Numbers, and allow for users to add additional accounts for a Payment Type.

The user will choose an existing Personal Account Number that matches one of the Payment Types offered
by the merchant. The User Agent MUST allow the user to change the amount. Example: User chooses VISA
and the merchant has asked for '2000 USD'. The User, presented with $20.00 USD may choose to increase this
amount to $40.00 and continue the payment transaction.

The User Agent SHOULD display the merchant website, the optional description and any other context
relevant to the purchase.

If the user indicates they want to pay, then a Payment transaction is begun. A user MUST NOT be able to cancel a transaction, although it MAY be aborted due to network or other error conditions.
<div class="aside">
### amount and Payment Type ###
UA SHOULD understand the relatinship between amount and applicable payment type. Example:
navigator.id.pay called with:

    var amounts = ['1000 USD', '853 EU', '51123 BTC'];
    var accepted_pay_types = {"VISA": "Authorize.net", "BITCOIN": "bitcoinexchange.biz"}

The UA SHOULD inform the user that they an either pay $10.00, 8.53 EU or 51.123 BTC. Once the user has selected a
payment method and before the are able to start the transaction, the UA MUST show which amount will be paid
with that chosen payment method.

So if a user selected their Bitcoin purse, then only 511.23 BTC would be displayed.

If the user selected VISA, then the user would still need to indicate which currency they prefer.

_TODO:_ - push this into the RP's responsibilities and only support one currency per API call?
</div> <!-- .aside -->

## Payment Transaction ##
The Wallet component of the User Agent begins the payment transaction with the merchant's chosen payment processor.

The Accepted Payment Type the user selected includes a Payment Processor domain name. The Wallet discovers the Payment Endpoint by requesting /.well-known/wallet. This JSON formatted file includes

- ** payment_endpoint ** - A relative URL where the Wallet will do payment transaction
- ** verification_endpoint ** - _Optional_ A relative URL which can do the verification crypto for the merchant

The Wallet SHOULD display an indeterminant progress bar while the transaction is being processed.

_TODO:_ REST or LIFD style?

The Wallet will open the ``payment_endpoint`` URL in a hidden iframe. This url is constructed out of ``https``, the payment domain and the ``payment_endpoint`` value.

This HTML page will setup a postMessage channel, so that the Wallet and the Payment Processor can interact via an RPC style protocol.

The wallet will send a ``startTransaction`` message with a JSON Payment Details object.

Example:
Wallet opens an iframe on https://example.com/incoming/payments

Wallet sends startTransaction

Wallet serializes and sends:

    {
      "amount": "1253 USD",
      "payment_type": "VISA",
      "cc_number": "4242123412344242",
      "expires": "04/12/2012",
      "description": "Pho Shizzle - Restaurant 5:32pm - Thanks, Come Again",
      "merchant_email": "billing@phoshizzle.biz",
      "customer_email": "alice@example.com"
    }

The Payment Processor does the various steps which are appropriate for the Payment Type to gain enough
confidence that they can capture a payment or a promise to pay based on the inputs.

The Payment Processor uses merchant_email and payment_type to locate the appropriate merchant account and
deposits or notes payment.

<div class="aside">
Note: Merchants are limited to one account per email address, but a Payment Processor MAY allow the merchant to assocaite different email accounts with different pay accounts to route the payments properly.

Example: billing@phoshizzle.biz versus accounting@phoshizzle.biz
</div> <!-- .aside -->
Properties such as ``cc_number`` and ``expires`` in the above example are specific
to the Recognized Payment Type ``VISA``.

### Basic Payment Details ###
All Payment Types will have the same basic Payment Details:

- ** amount ** - see navigator.id.pay required parameter amounts
- ** payment_type ** - a payment type code
- ** description **
- ** merchant_email **
- ** customer_email **

In addition to these Basic Payment Details, there are properties spectiifc to each Payment Type:

### VISA Payment Details ###
- ** cc_number **
- ** expires **
- ** cvv ** - Optional CVV code

A Wallet MAY collect a CVV when the Wallet UI is shown, but it MUST NOT save this data into the wallet for later use.

A Payment Processor MUST make cvv optional, but MAY offer more favorable processing rates when cvv is present.

### ACH Payment Details ###
- ** bank_route ** - String indicating the customer's bank routing number
- ** customer_account ** - String indicating the customer's bank account number

#### Example ####
    {
      "amount": "1253 USD",
      "payment_type": "ACH",
      "bank_route": "01234559234343212343443"
      "description": "Pho Shizzle - Restaurant 5:32pm - Thanks, Come Again",
      "merchant_email": "billing@phoshizzle.biz",
      "customer_email": "alice@example.com"
    }

_See Appendix A for Complete list of specific Payment Type Details_

If the Payment Processor is able to successfully complete the payment transaction, it generates a
transaction timestammp and geneates a cryptographically signed reciept.

The PaymentProcessor sends the ``paymentCompleted`` message with a JWT formatted reciept.

### Reciept Format ##
The decrypted form of the reciept includes the following information:

    {
      "amount": "1253 USD",
      "payment_type": "VISA",
      "display_cc_number": "********4242",
      "expires": "04/12/2012",
      "description": "Pho Shizzle - Restaurant 5:32pm - Thanks, Come Again",
      "merchant_email": "billing@phoshizzle.biz",
      "customer_email": "alice@example.com"
    }

<div class="aside">
Note: Payment Type Details will vary by Payment Type. Personal Account Numbers MUST NOT appear
in the receipt. These details are standardized per payment type and will usually include
enough content that a user can identify which Payment Method they used. Example for VISA

Recommendation - Obfuscated Personal Account Numbers should start with the name 'display', so
``cc_number`` will become ``display_cc_number``. ``bitcoin_purse`` will become ``display_bitcoin_purse``, etc.
</div><!-- .aside -->

If there is an error during the transaction, the PP should instead send a ``transactionCancelled`` message with an error code.

### Payment Processor Error Codes ###
A Payment processor may reject a payment for the following reasons:

    * INVALID_PAYMENT_TYPE
    * INVALID_PAYMENT_DETAILS
    * PAYMENT_EXPIRED
    * INSUFFICIENT_FUNDS
    * MERCHANT_UNKNOWN
    * NETWORK_ERROR
    * UNKNOWN_ERROR

In the future additional error codes MAY be added. Unknown error codes should be treated as UNKNOWN_ERROR.

When the Wallet recieves either ``paymentCompleted`` or ``transactionCancelled``, then this payment transaction is finished.

If the transaction ended in any of the following error codes, the User Agent's Wallet should attempt to
let the user "fix" the issue:

    * INVALID_PAYMENT_DETAILS
    * PAYMENT_EXPIRED
    * INSUFFICIENT_FUNDS

For all other errors, the UA Wallet MAY display an error message, and then MUST pass the error code through to the callback function supplied in navigator.id.pay.

For a successful transaction, the Wallet hides the UI to indicate the payment transaction has completed. The Wallet MUST pass the reciept object to the callback function.

The merchant's JavaScript callback is invoked and receives the receipt object.

## Receipt Verification ##
The merchant's JavaScript will now have the signed reciept from the Payment Processor. It should transmit this to a server side component for verification.

### Local Verification ###
The merchant website SHOULD do local verification of the reciept. TODO - Crypto Magic - Merchant knows Payment Processor and PP knows merchant, so we can have whatever secrets wherever they need to be.

### Optional Reciept Verification Service ###
A Payment Processor MAY chose to offer a receipt verification web service. To opt-in due the following:
Advertise a url in the ``verification_endpoint`` property of their ``/.well-known/payment`` file.
This web service with the following interface:

Accept POST JWT receipt as message body
    Return 200 {
      "status": "okay",
      "transaction_date": 123445345345,
      "amount": "1253 USD",
      "payment_type": "VISA",
      "display_cc_number": "****4242",
      "expires": "04/12/2012",
      "description": "Pho Shizzle - Restaurant 5:32pm - Thanks, Come Again",
      "merchant_email": "billing@phoshizzle.biz",
      "customer_email": "alice@example.com"
    }

Having this service and returning plain text JSON makes adoption of payment processors much easier for
merchant websites.

## Completing the Transaction ##
For a successful transaction and verification, at this point the merchant knows they have been paid and interaction with Persona Pay is complete.

A note on payment types: It is up to the merchant website to fulfill an order at the appropriate time based
on payment type. If the website accepts a payment type such as ACH which takes several weeks for settlement to
complete, and the goods or services are valueable, then it probably should not deliver to the customer until
it has finished the settlement phase of the transaction (outside of Persona Wallet flows). The website could
show a "pending deposit" state, etc.

A reciept is often a promise to pay, this doesn't change with Persona Wallet.

## Settlement ##
The last steps of the payment lifecycle are out of scope for Persona Wallet. The Payment Processor will coordinate the flow of money and indicate to the merchant various aspects of settlement, via existing means.

Some events related to this include:

    * Funds withdrawn from customer's Issuing bank
    * Funds deposited in merchant bank account
    * Charge-back against the transaction
    * etc

Appendix 1 - Specific Payment Type Details
...

Appendix 2 - Persona Payment Bootstrapping vs this Spec
A couple details mentioned in this spec are bootstrapping artifacts and not part of the spec.

## LIFD ##
LIFD - Locally Implement Feature Domain is a technique for introducing new browser features across vendors
via a JavaScript pollyfill directly, instead of leading with a native feature and letting the community polyfill.

This is appropriate for new features or services where:
* Chicken and the egg features would probably kill adoption
* Feature or service isn't usable with being ubiquitous
* ???

The JavaScript hosted at https://wallet.persona.org/include.js is a LIFD provided for cross platform support until native user agent support is wide-spread.

This is a bootstrapping technique and new instances of this pattern for Payment SHOUD NOT be used be other browser vendors. Native Wallets are preferred.

## Processor Proxies ##
In order to bootstrap usage of Persona Wallet, Mozilla will provider services which implement a Payment Processors proprietary interface and Proxy Persona Pay transactions. This will be done for a couple of the
most popular payment processors, which have the most painful interfaces.

These services aren't directly related to the Persona Wallet specification. As the actual Payment Processor stands up a Persona Wallet compatible service, Mozilla will decommission the proxy and Wallets will communciate direclty with the Payment Processor.

Usage of this proxy service will only be done for the LIFD and Mozilla based User Agents. Of course, other vendors could do an analygous fallback when discovery on a Payment Processor domain name fails.