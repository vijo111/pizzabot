var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
// App ID created for pizza bot
var connector = new builder.ChatConnector({
    appId: '88675847-f42c-4696-b86c-24456a91b144',
    appPassword: '65iAuZ8fxyA2Pk2hYMa1OAS'
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var user = '';
var OrderOrQA = {
    "Order Pizza": {
        val: "OrderPizza",
    },
    "Other Enquiries ": {
        val: "Enquiries",
    }
};

var Cuisine = {
    "Veg": {
        val: "veg"
    },
    "Non-Veg": {
        val: "nonveg"
    },
    "Beverages": {
        val: "beverages"
    }
};

var orderedItem = {
    "name": {
        val: ""
    },
    "price": {
        val: ""
    },
    "quantity": {
        val: "1"
    }
}

//Offer attachment for welcome message
var attachmentUrl = 'D://workspace/cit/BotApi/images/offer.jpg';
var contentType = 'image/jpg';

// Bot setup starts
// This is a Pizza order bot that uses multiple dialogs to prompt users for input.
// greetings dialog
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.userData.cart = [];
        builder.Prompts.text(session, "Welcome to Dominos Pizzas. I am Amy, your virtual assistant. <br>May I know your name please?");
    },
    function (session, results) {
        session.userData.userName = results.response;
        /* session.send('Hello %s! Its special offer especially for you.', results.response);
         var msg = new builder.Message(session)
         .addAttachment({
             contentUrl: attachmentUrl,
             contentType: contentType,
             name: 'Special Offer'
         });
          session.send(msg);*/
        session.beginDialog('askForOrderQuery');
    }
]);

// Dialog to get user base input
bot.dialog('askForOrderQuery', [
    function (session) {
        
        builder.Prompts.choice(session, "Hello " + session.userData.userName + "! Let me know what I can do for you?...please select...", OrderOrQA, { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        var order = OrderOrQA[results.response.entity];
        if (order.val == 'OrderPizza') {
            session.beginDialog('Order');
        } else {
            //diverting it for enquiry
            //Not yet determined
            session.beginDialog('query');
        }
    }
]);


// This Dialog prompts the when it matches 'order' as input
bot.dialog('Order', function (session, args, next) {
    session.beginDialog('askForCusine');
})
    .triggerAction({
        matches: /^Order$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the dialog stack 
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });

// Dialog to check user preference on his cusine
bot.dialog('askForCusine', [
    function (session) {
        builder.Prompts.choice(session, "That's Cool.. What you want to order?", Cuisine, { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        var CuisineV = Cuisine[results.response.entity];

        if (CuisineV.val == 'veg') {
            session.beginDialog('vegmenu');
        } else if (CuisineV.val == 'nonVeg') {
            session.beginDialog('nonveg');
        } else if (CuisineV.val == 'beverages') {
            session.beginDialog('beverages');
        }
    }
]);

// Dialog to show beverages menu.
// create reply with Carousel AttachmentLayout
bot.dialog('beverages', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.ThumbnailCard(session)
            .title("Pepsi")
            .text("in sizes (Regular, Medium, Large)")
            .images([builder.CardImage.create(session, 'D://workspace/cit/BotApi/images/Pepsi.png')])
            .buttons([
                builder.CardAction.imBack(session, "small pepsi", "small"),
                builder.CardAction.imBack(session, "medium pepsi", "medium"),
                builder.CardAction.imBack(session, "large pepsi", "large")
            ]),
        new builder.ThumbnailCard(session)
            .title("Coke")
            .text("in sizes (Regular, Medium, Large)")
            .images([builder.CardImage.create(session, 'D://workspace/cit/BotApi/images/coke.png')])
            .buttons([
                builder.CardAction.imBack(session, "small coke", "small"),
                builder.CardAction.imBack(session, "medium coke", "medium"),
                builder.CardAction.imBack(session, "large coke", "large")
            ]),
        new builder.ThumbnailCard(session)
            .title("fanta")
            .text("in sizes (Regular, Medium, Large)")
            .images([builder.CardImage.create(session, 'D://workspace/cit/BotApi/images/fanta.png')])
            .buttons([
                builder.CardAction.imBack(session, "small fanta", "small"),
                builder.CardAction.imBack(session, "medium fanta", "medium"),
                builder.CardAction.imBack(session, "large fanta", "large")
            ]),
    ]);
    session.send(msg);
}).triggerAction({ matches: /^(pepsi|coke|fanta|drink|drinks|beverages)/i });


// Added dialog to handle 'beverage' button click
bot.dialog('buybeveragesClick', [
    function (session, args, next) {
        // Get order from users utterance
        var utterance = args.intent.matched[1];
        var item = /(small pepsi|medium pepsi|large pepsi|small coke|medium coke|large coke|small fanta|medium fanta|large fanta)/i.exec(utterance);
        console.log('beverages', item[0]);

        var item = session.dialogData.item = {
            prodct: item[0],
            size: null,
            price: null,
            qty: 1,
            crust: null,
            toppings: null
        };
        // price tags for different siza
        if ((item.prodct).indexOf('small') !== -1) {
            item.price = 50;
            item.size = 'small';
        } else if ((item.prodct).indexOf('medium') !== -1) {
            item.price = 60;
            item.size = 'medium';
        } else if ((item.prodct).indexOf('large') !== -1) {
            item.price = 70;
            item.size = 'large';
        }
        session.userData.cart.push(item);

        session.send("A '%(prodct)s' has been added to your cart.", item);
        builder.Prompts.confirm(session, "Say 'Yes' to continue adding items <br> or Say 'No' to check out?");
    },
    function (session, results) {
        if (results.response) {
            session.beginDialog('askForCusine');
        } else {
            session.beginDialog('askForCheckOutConfirm');
        }
    }
]).triggerAction({ matches: /(small pepsi|medium pepsi|large pepsi|small coke|medium coke|large coke|small fanta|medium fanta|large fanta)/i });

// Dialog to show menu for veg pizza
//carousel attachment layout
bot.dialog('vegmenu', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Margherita")
            .subtitle("Loaded with extra cheese!")
            .text("in sizes (Regular, Medium, Large)")
            .images([builder.CardImage.create(session, 'D://workspace/cit/BotApi/images/Margherita.jpg')])
            .buttons([
                builder.CardAction.imBack(session, "Small Margherita", "Small"),
                builder.CardAction.imBack(session, "Medium Margherita", "Medium"),
                builder.CardAction.imBack(session, "Large Margherita", "Large")
            ]),
        new builder.HeroCard(session)
            .title("CountrySpecial")
            .subtitle("Onion | Capsicum | Mushroom | Corn | Paneer")
            .text("in sizes (Regular, Medium, Large)")
            .images([builder.CardImage.create(session, 'D://workspace/cit/BotApi/images/5pepper.jpg')])
            .buttons([
                builder.CardAction.imBack(session, "Small 5pepper", "Small"),
                builder.CardAction.imBack(session, "Medium 5pepper", "Medium"),
                builder.CardAction.imBack(session, "Large 5pepper", "Large")
            ]),
        new builder.HeroCard(session)
            .title("CountrySpecial")
            .subtitle("Onion | Capsicum | Mushroom | Corn | Paneer")
            .text("in sizes (Regular, Medium, Large)")
            .images([builder.CardImage.create(session, 'D://workspace/cit/BotApi/images/CountrySpecial.jpg')])
            .buttons([
                builder.CardAction.imBack(session, "Small CountrySpecial", "Small"),
                builder.CardAction.imBack(session, "Medium CountrySpecial", "Medium"),
                builder.CardAction.imBack(session, "Large CountrySpecial", "Large")
            ]),
        new builder.HeroCard(session)
            .title("CountrySpecial")
            .subtitle("Onion | Capsicum | Mushroom | Corn | Paneer")
            .text("in sizes (Regular, Medium, Large)")
            .images([builder.CardImage.create(session, 'D://workspace/cit/BotApi/images/DeluxeVeg.jpg')])
            .buttons([
                builder.CardAction.imBack(session, "Small DeluxeVeg", "Small"),
                builder.CardAction.imBack(session, "Medium DeluxeVeg", "Medium"),
                builder.CardAction.imBack(session, "Large DeluxeVeg", "Large")
            ]),
        /*new builder.HeroCard(session)
            .title("VegExtravanza")
            .subtitle("Onion | Capsicum | Jalapeno | Corn | Paneer")
            .text("in sizes (Regular, Medium, Large)")
            .images([builder.CardImage.create(session, 'D://workspace/cit/BotApi/images/VegExtravanza.jpg')])
            .buttons([
                builder.CardAction.imBack(session, "Small VegExtravanza", "Small"),
                builder.CardAction.imBack(session, "Medium VegExtravanza", "Medium"),
                builder.CardAction.imBack(session, "Large VegExtravanza", "Large")                     
            ])*/
    ]);
    session.send(msg);
    session.send("hmm.. furthermore You can say 'Veg menu' any time to see this 'Menu'..");
}).triggerAction({ matches: /^(vegmenu|veg menu|menu)/i });


// Add dialog to handle 'Buy' button click
bot.dialog('buyButtonClick', [
    function (session, args, next) {
        // Get order from users utterance
        var utterance = args.intent.matched[1];
        var pizza = /(Small Margherita|Medium Margherita|Large Margherita|Small CountrySpecial|Medium CountrySpecial|Large CountrySpecial|Small VegExtravanza|Medium VegExtravanza|Large VegExtravanza|Small 5pepper|Medium 5pepper|Large 5pepper|Small DeluxeVeg|Medium DeluxeVeg|Large DeluxeVeg)/i.exec(utterance);
        console.log('pizza', pizza[0]);
        var item = session.dialogData.item = {
            prodct: pizza[0],
            size: null,
            price: null,
            qty: 1,
            crust: null,
            toppings: null
        };
        if ((item.prodct).indexOf('Small') !== -1) {
            item.price = 100;
            item.size = 'small';
        } else if ((item.prodct).indexOf('Medium') !== -1) {
            item.price = 150;
            item.size = 'medium';
        } else if ((item.prodct).indexOf('Large') !== -1) {
            item.size = 'large';
            item.price = 175;
        }

        // Add to cart
        builder.Prompts.choice(session, "Choose your crust?", "Hand Tossed|Cheese burst|Wheat thin|Fresh Pan");

    }, function (session, results) {
        // Save crust if prompted
        var item = session.dialogData.item;
        if (results.response) {
            item.crust = results.response.entity.toLowerCase();
        }

        // Add to cart
        builder.Prompts.choice(session, "Add your Topping", "Black Olive|Capsicum|Mushroom|Red Paprika|Corn|Jalapeno", { listStyle: builder.ListStyle.button });
    }, function (session, results) {
        // Save toppings if prompted
        var item = session.dialogData.item;
        if (results.response) {
            item.toppings = results.response.entity.toLowerCase();
        }

        // adding items to session
        session.userData.cart.push(item);

        session.send("A %(crust)s %(prodct)s' pizza <br/>with %(toppings)s has been added to your cart.", item);
        builder.Prompts.confirm(session, "Say 'Yes' to continue adding pizza <br> or Say 'No' to check out?");
    },
    function (session, results) {
        if (results.response) {
            session.beginDialog('askForCusine');
        } else {
            session.beginDialog('askForCheckOutConfirm');
        }
    }
]).triggerAction({ matches: /(Small Margherita|Medium Margherita|Large Margherita|Small CountrySpecial|Medium CountrySpecial|Large CountrySpecial|Small VegExtravanza|Medium VegExtravanza|Large VegExtravanza|Small 5pepper|Medium 5pepper|Large 5pepper|Small DeluxeVeg|Medium DeluxeVeg|Large DeluxeVeg)/i });

var order = 1234;
bot.dialog('askForCheckOutConfirm', [
    function (session) {
        var cartx = session.userData.cart;
        session.send("Hey %s. Here you go..Your Cart is confirmed.<br/>Below were the items you have ordered..",
            session.userData.userName);
        //var text="";
        /*
    for (i = 0; i < session.userData.cart.length; i++) {
        var x = session.userData.cart[i];
        console.log("cart fff:", x.prodct);
        console.log("cart fff:", x.size);
        var count = i+1;
        
        session.send(count+". <u>%(prodct)s</u> <br/><br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; size: %(size)s <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; crust: %(crust)s <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; toppings:  %(toppings)s ", x);
    }*/
        /*   var arr2 = [];
           var arr = [];
           for (i = 0; i < session.userData.cart.length; i++) {
               var x = session.userData.cart[i];
               console.log('session.userData.cart[i]',session.userData.cart[i].price);
               console.log('session.userData.cart[i]',session.userData.cart[i].prodct);
               arr.push({ name: JSON.stringify(session.userData.cart[i].prodct), price:JSON.stringify(session.userData.cart[i].price), quantity: 1 });
           }
           for (i = 0; i < arr.length; i++) {
               arr2.push(new builder.ReceiptItem.create(session, arr[i].price, arr[i].name));
           }
           
           var msg = new builder.Message(session).addAttachment(
               new builder.ReceiptCard(session)
                   .title("Order Receipt")
                   .facts([
                       builder.Fact.create(session, order++, 'Order Number'),
                       builder.Fact.create(session,session.userData.userName, 'User' ),
                       builder.Fact.create(session, '987', 'VAT invoice')
                    ])                
                    .items(arr2)
                    .tax('$ 7.50')
                    .total('$ 90.95')
                    .buttons([
                       builder.CardAction.imBack(session, "Pay", "Pay")
                   ])
               
           );
           session.send(msg);*/
        //console.log('arr2..',arr2);
        var card = createReceiptCard(session);
        console.log('card..', card);
        var msg1 = new builder.Message(session).addAttachment(card);
        console.log('msg..', msg1);
        session.send(msg1);
    }
]);

//dialog to create receipt card
function createReceiptCard(session) {
    console.log('session.userData.cart.length', session.userData.cart.length);

    var arr = [];
    for (i = 0; i < session.userData.cart.length; i++) {
        var x = session.userData.cart[i];
        console.log('session.userData.cart[i]', session.userData.cart[i].price);
        arr.push({ name: JSON.stringify(session.userData.cart[i].prodct), price: JSON.stringify(session.userData.cart[i].price), quantity: 1 });
    }
    console.log('prodct', arr[0].name);
    console.log('price', arr[0].price);
    /*
        var arr = [];
        arr.push({ name: 'Item1', price: '10', quantity: 1 });
        arr.push({ name: 'Item2', price: '20', quantity: 2 });
        
    */
    // calculating totals and tax
    var sum = 0;
    var total = 0;
    var taxpercent = 0.18;
    var taxamount = 0
    arr2 = [];
    for (i = 0; i < arr.length; i++) {
        sum = (sum) + Number(arr[i].price);
        arr2.push(new builder.ReceiptItem.create(session, arr[i].price, arr[i].name));
    }
    taxamount = Number(taxpercent) * Number(sum);
    total = Number(taxamount) + Number(sum);
    return new builder.ReceiptCard(session)
        .title(session.userData.userName)
        .facts([
            // builder.Fact.create(session, order++, 'Order Number'),
            // builder.Fact.create(session, 'VISA 5555-****', 'Payment Method')
            builder.Fact.create(session, '987', 'VAT invoice')
        ])
        .items(arr2)
        .tax('(18%)   Rs.' + taxamount)
        .total('Rs.' + total)
        .buttons([
            builder.CardAction.imBack(session, "Payment done", "Pay")
        ]);
}


// Add dialog to handle 'Pay' button click
bot.dialog('pay', [
    function (session, args, next) {
        session.send("Thanks for ordering pizza. Have a great day ");
        session.endDialog();
    }
]).triggerAction({ matches: /^(pay)/i });
