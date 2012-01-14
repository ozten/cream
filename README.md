C.R.E.A.M-ery.co is a set of experiments around giving users 
fiscal agency across the web. Huh?

It's a **very early** stages playground for exploring
The Future Of Money technologies such as mobile wallets,
browser APIs, and TPS reports.

Why is it so hard to give and receive money? What if there were
a simple, open web standard that protects users identities and
makes life easier.

* GetTheMoney - Simplest way to pay and GET PAYED!
* Wallet - LIFT API for cross-domain payment

Code organization
    www - collection of experiments
    \---nginx.conf - Hosts c.r.e.a.m-ery.co 
    \---get_the_money/ - Node.js app
    \---wallet/ - Node.js app hosting include.js

Dependencies:

* Nginx
* Redis
* node 0.6.6
* ozten/connect-browserid