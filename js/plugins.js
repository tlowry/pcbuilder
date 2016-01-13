var pcbuilder = pcbuilder || {};

// Base Plugin
pcbuilder.Plugin = function(name) {
    this.name = name;
};

pcbuilder.Plugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.prototype.constructor = pcbuilder.Plugin;

pcbuilder.Plugin.prototype.parse = function(basket) {
    basket.error = {
        title: "Not implemented",
        message: "please report this as a bug, plugin: " + this.name + ""
    };
}

// HardwareVersand Plugin
pcbuilder.Plugin.Hwvsplugin = function() {
    pcbuilder.Plugin.call(this, "hardwareversand.de plugin by github.com/tlowry/");
}

pcbuilder.Plugin.Hwvsplugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.Hwvsplugin.prototype.constructor = pcbuilder.Plugin.Hwvsplugin;

pcbuilder.Plugin.Hwvsplugin.prototype.parse = function(basket) {
    if (window.location.pathname.indexOf("/basket.jsp") == -1) {
        basket.error = {
            title: "Redirect",
            message: "please navigate to the <a href=\"/basket.jsp\">basket</a>"
        };
    } else {
        var basketForm = $("form").filter(".yform, [href='basket.jsp']").first();
        if (basketForm.length) {
            basketBody = basketForm.find("tbody");

            if (basketBody.length) {
                basketBody.find("tr").each(function(i, val) {
                    // Every even line is just a header
                    if (i % 2 !== 0) {

                        var name, link = "";
                        var qty, price = 0;

                        $(this).find("td").each(function(i, val) {
                            switch (i) {

                                case 0:
                                    // Name + url
                                    lnk = $(this).find("a").first()

                                    name = lnk.text();
                                    link = "http://www.hardwareversand.de" + lnk.attr("href");

                                    break;
                                case 1:
                                    // Availability
                                    availability = $(this).text();
                                    break;
                                case 2:
                                    // Unit price
                                    priceDiv = $(this).find("p").filter(".price").first();
                                    /* 
										Hwvs use a '.' to separate prices > 1000 and a comma for 
										the cent value for some reason, just remove the 1000 sep
									*/
                                    priceStr = priceDiv.text().replace(".", "").replace(",", ".")
                                    price = parseFloat(priceStr);
                                    break;
                                case 3:
                                    // quantity (input)
                                    qtyInput = $(this).find("input").first();
                                    qty = qtyInput.val()
                                    break;
                                case 4:
                                    // full price (quantity*unit)
                                    break

                                default:
                                    pcbuilder.trace("Unknown column");
                                    break
                            }

                        });

                        basket.addLine(name, link, qty, price * qty);
                    }
                });
                basket.addLine("Shipping", "", 0, 12.50);

            } else {
                pcbuilder.trace("Couldn't find the table of items");
                basket.error = {
                    title: "Empty",
                    message: "Please add something to the basket"
                };
            }
        } else {
            pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
        }
    }
}

// MindFactory plugin
pcbuilder.Plugin.mindFactoryPlugin = function() {
    pcbuilder.Plugin.call(this, "mindfactory.de plugin by github.com/tlowry/");
}

pcbuilder.Plugin.mindFactoryPlugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.mindFactoryPlugin.prototype.constructor = pcbuilder.Plugin.mindFactoryPlugin;

pcbuilder.Plugin.mindFactoryPlugin.prototype.parse = function(basket) {

    // Mindfactory basket is available on all pages so no need to redirect
    var basketForm = $("#box_cart");
    if (basketForm.length) {

        basketForm.find(".pab10").each(function(i, val) {

            qty = 1;
            qtyText = $(this).find(".colorgrey.size11.floatLeft").first().text();
            priceAndId = qtyText.split(" x ");

            // no 'x' for qty means "service level gold" (not purchased item)
            if (priceAndId.length > 1) {
                qtyStr = priceAndId[0];
                pcbuilder.trace(qtyText)
                qty = parseInt(qtyStr);

                lnk = $(this).find("a").first();
                link = lnk.attr("href");
                desc = lnk.find("img").first().attr("alt");

                pcbuilder.trace("qty " + qty);

                priceText = $(this).find(".floatRight.colorblack.size11").first().text();
                pcbuilder.trace("priceText" + priceText);

                priceStart = priceText.indexOf(" ");
                pcbuilder.trace("priceStart" + priceStart);
                priceStr = priceText.substring(priceStart + 1, priceText.length - 1).replace(",", ".");
                price = parseFloat(priceStr);

                pcbuilder.trace("price " + priceStr);

                basket.addLine(desc, link, qty, price);
            }
        });
        if (basket.size() > 0) {
            basket.addLine("Shipping", "", 1, 29.99);
        } else {
            basket.error = {
                title: "Empty",
                message: "Please add an item to the basket"
            };
        }

    } else {
        pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
        basket.error = {
            title: "Missing",
            message: "couldn't find the basket, the extension may need a patch!"
        };
    }
};

// Amazon plugin
pcbuilder.Plugin.amazonPlugin = function() {
    pcbuilder.Plugin.call(this, "amazon plugin by github.com/tlowry/");
}

pcbuilder.Plugin.amazonPlugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.amazonPlugin.prototype.constructor = pcbuilder.Plugin.amazonPlugin;

pcbuilder.Plugin.amazonPlugin.prototype.parse = function(basket) {

    if (window.location.pathname.indexOf("/gp/cart/view.html") == -1) {
        basket.error = {
            title: "Redirect",
            message: "please navigate to the <a href=\"/gp/cart/view.html\">basket</a>"
        };
    } else {
        var basketForm = $("#activeCartViewForm");
        if (basketForm.length) {

            // Set the currency from any of the prices
            sign = basketForm.find(".sc-price-sign").first().text()[0];
            basket.currency = sign;

            // Most of the info is on the sc-list-item divs
            basketForm.find(".sc-list-item").each(function(i, val) {
                qty = 1;
                qtyStr = $(this).attr("data-quantity");
                qty = parseInt(qtyStr);

                priceText = $(this).attr("data-price");
                pcbuilder.trace("priceText" + priceText);
                price = parseFloat(priceText);

                var lnk = $(this).find(".sc-product-link:first");
                link = window.location.host + lnk.attr("href");
                desc = lnk.find(".sc-product-title").first().text();

                basket.addLine(desc, link, qty, qty * price);
            });

            if (basket.size() < 1) {
                basket.error = {
                    title: "Empty",
                    message: "Please add an item to the basket"
                };
            }
        } else {
            pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
            basket.error = {
                title: "Missing",
                message: "couldn't find the basket, the extension may need a patch!"
            };
        }
    }
};

// dabs plugin
pcbuilder.Plugin.dabsPlugin = function() {
    pcbuilder.Plugin.call(this, "dabs plugin by github.com/tlowry/");
}

pcbuilder.Plugin.dabsPlugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.dabsPlugin.prototype.constructor = pcbuilder.Plugin.dabsPlugin;

pcbuilder.Plugin.dabsPlugin.prototype.parse = function(basket) {

    if (window.location.pathname.indexOf("/basket") == -1) {
        basket.error = {
            title: "Redirect",
            message: "please navigate to the <a href=\"/basket\">basket</a>"
        };
    } else {
        var basketForm = $("#middle-col");
        if (basketForm.length) {

            // Set the currency from any of the prices
            sign = basketForm.find(".price").first().text()[0];


            // Most of the info is on the sc-list-item divs
            basketForm.find(".basket-item").each(function(i, val) {

                lnk = $(this).find(".inner-item-details .title").first();

                // Make relative url absolute
                link = window.location.host + lnk.attr("href");

                desc = pcbuilder.util.sanitize(lnk.text());

                priceCurrencyStr = $(this).find(".price").first().text();
                basket.currency = priceCurrencyStr[0];

                priceStr = priceCurrencyStr.substring(1, priceCurrencyStr.length);
                price = parseFloat(priceStr);

                qtyStr = $(this).find(".item-qty-box").first().attr("value");
                qty = parseInt(qtyStr);

                basket.addLine(desc, link, qty, price);
            });

            // Delivery
            deliveryWeight = basketForm.find("#deliveryweight").first().text();
            desc = "Delivery (" + deliveryWeight + "kg)";

            deliveryCurrency = basketForm.find("#delivery").first().text();
            priceStr = deliveryCurrency.substring(1, deliveryCurrency.length);
            price = parseFloat(priceStr);

            qty = 1;
            basket.addLine(desc, "", qty, price);


            if (basket.size() < 1) {
                basket.error = {
                    title: "Empty",
                    message: "Please add an item to the basket"
                };
            }
        } else {
            pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
            basket.error = {
                title: "Missing",
                message: "couldn't find the basket, the extension may need a patch!"
            };
        }
    }
};

// ocuk plugin
pcbuilder.Plugin.ocukPlugin = function() {
    pcbuilder.Plugin.call(this, "ocuk plugin by github.com/tlowry/");
}

pcbuilder.Plugin.ocukPlugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.ocukPlugin.prototype.constructor = pcbuilder.Plugin.ocukPlugin;

pcbuilder.Plugin.ocukPlugin.prototype.parse = function(basket) {

    // Ocuk has almost all of the info in the basket widget on every page but names are clipped
    if (window.location.pathname.indexOf("/viewcart.php") == -1) {
        basket.error = {
            title: "Redirect",
            message: "please navigate to the <a href=\"/viewcart.php\">basket</a>"
        };
    } else {
        var basketForm = $("#shoppingBkt");
        if (basketForm.length) {

            // track the shpping entry
            var fixedItemIndex = 0;
            // Set the currency from any of the prices
            basketForm.find("tr").each(function(i) {

                // Skip the first table row with headers
                if (i > 0) {

                    if ($(this).attr("id")) {

                    } else if ($(this).attr("class")) {
                        if (fixedItemIndex == 1) {
                            // Shipping info
                            $(this).find("td").each(function(i, val) {
                                if (i == 2) {
                                    shippingCurrency = $(this).text();
                                    shipStr = shippingCurrency.substring(1, shippingCurrency.length);
                                    shipPrice = parseFloat(shipStr);
                                    basket.addLine("Shipping", "", 0, shipPrice)
                                }
                            });
                        }
                        fixedItemIndex++

                    } else {
                        // Plain items
                        desc = "";
                        link = ""
                        qty = 1;
                        price = 1.0;

                        $(this).find("td").each(function(i, val) {
                            switch (i) {
                                case 1:
                                    // link + name
                                    lnk = $(this).find("a").first();
                                    link = window.location.host + "/" + lnk.attr("href");
                                    desc = lnk.text();
                                    break;

                                case 2:
                                    // Qty
                                    qtyStr = $(this).find("input").first().attr("value");
                                    qty = parseFloat(qtyStr);
                                    break;

                                case 4:
                                    // Total in vat
                                    deliveryCurrency = $(this).find(".lineTotal").first().text();
                                    basket.currency = deliveryCurrency[0];
                                    priceStr = deliveryCurrency.substring(1, deliveryCurrency.length - 1);
                                    price = parseFloat(priceStr);
                                    break;
                            }

                        })

                        basket.addLine(desc, link, qty, price);
                    }
                }

            });

            if (basket.size() < 1) {
                basket.error = {
                    title: "Empty",
                    message: "Please add an item to the basket"
                };
            }
        } else {
            pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
            basket.error = {
                title: "Missing",
                message: "couldn't find the basket, the extension may need a patch!"
            };
        }
    }
};

// scanuk plugin
pcbuilder.Plugin.scanukPlugin = function() {
    pcbuilder.Plugin.call(this, "scanuk plugin by github.com/tlowry/");
}

pcbuilder.Plugin.scanukPlugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.scanukPlugin.prototype.constructor = pcbuilder.Plugin.scanukPlugin;

pcbuilder.Plugin.scanukPlugin.prototype.parse = function(basket) {

    var basketForm = $("#live-basket");
    if (basketForm.length) {

        desc = "";
        link = "";
        qty = 0;
        price = 1.0;

        // Find each product
        basketForm.find(".live-basket-product").each(function(i) {

            // link + description
            lnk = $(this).find(".description").first();
            link = lnk.attr("href");
            desc = lnk.text();

            // Price + currency
            prc = $(this).find("span.price").first();
            priceCurrency = prc.text();

            basket.currency = priceCurrency[0];

            priceStr = priceCurrency.substring(1, priceCurrency.length);
            price = parseFloat(priceStr);

            // Quantity
            qtyStr = $(this).find(".buy-button p").first().text();
            qty = parseInt(qtyStr)

            basket.addLine(desc, link, qty, price);
        });

        // Find shipping 
        shipStr = basketForm.find(".live-basket-carriage-gross").first().text();
        shipPrice = parseFloat(shipStr);

        basket.addLine("Shipping", "", 0, shipPrice);

        if (basket.size() < 1) {
            basket.error = {
                title: "Empty",
                message: "Please add an item to the basket"
            };
        }
    } else {
        pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
        basket.error = {
            title: "Missing",
            message: "couldn't find the basket, the extension may need a patch!"
        };
    }

};

pcbuilder.Plugin.specialtechPlugin = function() {
    pcbuilder.Plugin.call(this, "specialtech plugin by github.com/tlowry/");
}

pcbuilder.Plugin.specialtechPlugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.specialtechPlugin.prototype.constructor = pcbuilder.Plugin.specialtechPlugin;

pcbuilder.Plugin.specialtechPlugin.prototype.parse = function(basket) {

    if (/.*\/spshop\/cart.php$/.exec(window.location.pathname) == null) {
        basket.error = {
            title: "Redirect",
            message: "please navigate to the <a href=\"/spshop/cart.php\">basket</a>"
        };
    } else {
        var basketForm = $(".fw-cart");
        if (basketForm.length) {

            basketForm.find(".cart-item").each(function(i) {
                desc = i + "";
                link = "";
                qty = 0;
                price = 1.0;

                // link + description
                lnk = $(this).find(".product-title").first();
                link = lnk.attr("href");
                desc = lnk.text();

                // quantity
                qtyDiv = $(this).find(".qty-wrapper input").first();
                qtyStr = qtyDiv.val();
                qty = parseInt(qtyStr);

                // line cost (qty*price) and currency
                cost = $(this).find(".subtotal .currency").first();
                priceCurrency = cost.text();

                basket.currency = priceCurrency[0];

                priceStr = priceCurrency.substring(1, priceCurrency.length);
                price = parseFloat(priceStr);

                basket.addLine(desc, link, qty, price);
            });

            // Shipping unknown until checkout, just pick first (default option)
            firstShipOption = basketForm.find(".checkout-shippings table tr").first();
            shipName = "Shipping";
            shipCost = 0.0;
            firstShipOption.find("td").each(function(i) {
                if ($(this).attr("class") == "shipping-name") {
                    var txt = $(this).find("label").first().text();
                    txt = pcbuilder.util.sanitize(txt);
                    shipName += "(" + txt + ")";
                } else if ($(this).attr("class") == "shipping-cost") {
                    var txt = $(this).find(".currency").first().text();
                    basket.currency = txt[0];
                    cost = txt.substring(1, txt.length);
                    shipCost = parseFloat(cost);
                }
            });

            basket.addLine(shipName, "", 0, shipCost);

            if (basket.size() < 1) {
                basket.error = {
                    title: "Empty",
                    message: "Please add an item to the basket"
                };
            }
        } else {
            pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
            basket.error = {
                title: "Missing",
                message: "couldn't find the basket, the extension may need a patch!"
            };
        }
    }
};

pcbuilder.Plugin.pcPartPickerPlugin = function() {
    pcbuilder.Plugin.call(this, "pcpartpicker plugin by github.com/tlowry/");
}

pcbuilder.Plugin.pcPartPickerPlugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.pcPartPickerPlugin.prototype.constructor = pcbuilder.Plugin.pcPartPickerPlugin;

pcbuilder.Plugin.pcPartPickerPlugin.prototype.parse = function(basket) {

    if (/.*\/saved\.*/.exec(window.location.pathname) == null) {
        basket.error = {
            title: "Redirect",
            message: "Please navigate to a saved list"
        };
    } else {
        var basketForm = $("#lg_partlist tbody");
        if (basketForm.length) {

            basketForm.find("tr").each(function(i) {

                desc = "";
                link = "";
                qty = 1;
                price = 0.0;
                unique = true;
                done = false;

                $(this).find("td").each(function(i) {

                    switch (i) {
                        // link + description
                        case 2:

                            lnk = $(this).find("a").first();
                            link = lnk.attr("href");

                            if (typeof link === 'undefined') {
                                done = true;
                                return false;
                            } else {
                                link = window.location.host + link;
                                desc = lnk.text();

                                for (i = 0; i < basket.size(); i++) {
                                    line = basket.getLine(i);
                                    if (line.url == link) {

                                        pricePerUnit = line.price / line.quantity;
                                        // already in basket, increment and break from loop
                                        line.quantity += 1;
                                        line.price += pricePerUnit;
                                        basket.total += pricePerUnit;
                                        unique = false;
                                        return false;
                                    }
                                }
                            }

                            break;

                        case 3:

                            priceCurrency = pcbuilder.util.sanitize($(this).text());

                            // Some items have no price, sometimes discontinued or unavailable
                            if (priceCurrency.length > 0) {
                                priceCurrencyAndCrap = priceCurrency.split(" ");

                                if (priceCurrencyAndCrap.length > 0) {
                                    priceCurrency = priceCurrencyAndCrap[0];
                                }
                                pcbuilder.util.sanitize(priceCurrency);
                                basket.currency = priceCurrency[0];
                                priceStr = priceCurrency.substring(1, priceCurrency.length);
                                price = parseFloat(priceStr);
                            }
                            break;
                    }

                });

                if (done) {
                    return false;
                }

                if (unique) {
                    basket.addLine(desc, link, qty, price);
                }

            });

            if (basket.size() < 1) {
                basket.error = {
                    title: "Empty",
                    message: "Please add an item to the list"
                };
            }
        } else {
            pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
            basket.error = {
                title: "Missing",
                message: "couldn't find the basket, the extension may need a patch!"
            };
        }
    }
};

pcbuilder.Plugin.komplettPlugin = function() {
    pcbuilder.Plugin.call(this, "komplett plugin by github.com/tlowry/");
}

pcbuilder.Plugin.komplettPlugin.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Plugin.komplettPlugin.prototype.constructor = pcbuilder.Plugin.komplettPlugin;

pcbuilder.Plugin.komplettPlugin.prototype.parse = function(basket) {

    if (/.*\/shoppingcart\.*/.exec(window.location.pathname) == null) {
        basket.error = {
            title: "Redirect",
            message: "Please navigate to the <a href=\"/shoppingcart/default.aspx\">basket</a>"
        };
    } else {
        var basketForm = $("#ctl00_ContentPlaceHolder1_shoppingCart_shoppingcartDialog_dialogContent");
        if (basketForm.length) {

            basketForm.find(".shoppingcart-listcontainer").each(function(i) {

                desc = "";
                link = "";
                qty = 1;
                price = 0.0;

                // link id varies a little, use a regex to find it
                var linkExp = new RegExp(".*productTitleHyperLink");
                lnk = $(this).find("a").filter(function() {
                    return linkExp.exec($(this).attr('id'));
                }).first();

                if (lnk.length > 0) {

                    link = lnk.attr("href");
                    link = "http://" + window.location.host + link;

                    var descExp = new RegExp(".*_productTitleLabel");
                    dsc = $(this).find("span").filter(function() {
                        return descExp.exec($(this).attr('id'));
                    }).first();

                    desc = dsc.text();

                    var qtyExp = new RegExp(".*productQuantityTextBox");
                    qtyInput = $(this).find("input").filter(function() {
                        return qtyExp.exec($(this).attr('id'));
                    }).first();

                    if (qtyInput.length > 0) {
                        qty = parseFloat(qtyInput.val());
                    }

                    var totalExp = new RegExp(".*_productSubtotalLabel");

                    subTotalSpan = $(this).find("span").filter(function() {
                        return totalExp.exec($(this).attr('id'));
                    }).first();

                    priceAndCurrency = subTotalSpan.text();
                    basket.currency = priceAndCurrency.charAt(0);
                    price = parseFloat(priceAndCurrency.substring(1, priceAndCurrency.length));

                    basket.addLine(desc, link, qty, price);
                }
            });

            if (basket.size() < 1) {
                basket.error = {
                    title: "Empty",
                    message: "Please add an item to the basket"
                };
            } else {

                shipForm = $("#ctl00_ContentPlaceHolder1_deliveryMethod_orderMethodDialog_dialogContent").first();
                if (shipForm.length > 0) {
                    methodSpan = shipForm.find("#ctl00_ContentPlaceHolder1_deliveryMethod_orderMethodDialog_deliveryMethodASPxCallbackPanel_orderMethodRepeater_ctl01_orderMethodTitleLabel").first();
                    method = methodSpan.text();

                    costSpan = shipForm.find("#ctl00_ContentPlaceHolder1_deliveryMethod_orderMethodDialog_deliveryMethodASPxCallbackPanel_orderMethodRepeater_ctl01_orderMethodPriceLabel");
                    costText = costSpan.text();
                    costNum = costText.substring(1, costText.length);
                    shipCost = parseFloat(costNum);

                    basket.addLine("Shipping (" + method + ") ", "", 0, shipCost);
                } else {
                    pcbuilder.trace("Failed to find shipping");
                }
            }
        } else {
            pcbuilder.trace("Couldn't find the basket, forms " + basketForm.length + " forms");
            basket.error = {
                title: "Missing",
                message: "couldn't find the basket, the extension may need a patch!"
            };
        }
    }
};

// Used to lookup appropriate plugin to use based on url
pcbuilder.plugins = [{
    pattern: /.+hardwareversand\.de.*/,
    obj: pcbuilder.Plugin.Hwvsplugin
}, {
    pattern: /.+mindfactory\.de.*/,
    obj: pcbuilder.Plugin.mindFactoryPlugin
}, {
    pattern: /.+amazon\.*/,
    obj: pcbuilder.Plugin.amazonPlugin
}, {
    pattern: /.+dabs\.*/,
    obj: pcbuilder.Plugin.dabsPlugin
}, {
    pattern: /.+overclockers\.*/,
    obj: pcbuilder.Plugin.ocukPlugin
}, {
    pattern: /.+scan\.*/,
    obj: pcbuilder.Plugin.scanukPlugin
}, {
    pattern: /.+specialtech\.*/,
    obj: pcbuilder.Plugin.specialtechPlugin
}, {
    pattern: /.*pcpartpicker.*/,
    obj: pcbuilder.Plugin.pcPartPickerPlugin
}, {
    pattern: /.*komplett.*/,
    obj: pcbuilder.Plugin.komplettPlugin
}];

pcbuilder.pluginForUrl = function(url) {
        for (i = 0; i < pcbuilder.plugins.length; i++) {
            entry = pcbuilder.plugins[i];
            match = entry.pattern.exec(url);
            if (match != null) {
                return entry.obj;
            }
        }

        return null;
    }
    /* END plugin code*/

/* Formatters */

pcbuilder.Formatter = function(name, desc) {
    this.name = name;
    this.description = desc;
};

pcbuilder.Formatter.prototype = Object.create(pcbuilder.Plugin.prototype);
pcbuilder.Formatter.prototype.constructor = pcbuilder.Plugin;

pcbuilder.Formatter.prototype.parse = function(basket) {
    return {
        error: "Not implemented",
        message: "please report this as a bug, formatter: \"" + this.name + "\""
    };
}

pcbuilder.Formatter.prototype.render = function(basket, useLinks, node) {
    formatted = this.parse(basket, useLinks);
    node.setText(formatted.result);
}

pcbuilder.Formatter.prototype.renderToClipBoard = function(basket, node) {
    return node.getText();
}

pcbuilder.Formatter.prototype.HomeUrl = null;
pcbuilder.Formatter.prototype.HomeUrlPattern = null;

pcbuilder.Formatter.Boardsie = function() {
    pcbuilder.Formatter.call(this, "Boards.ie", "Boards.ie formatter by github.com/tlowry/");
}

pcbuilder.Formatter.Boardsie.prototype = Object.create(pcbuilder.Formatter.prototype);
pcbuilder.Formatter.Boardsie.prototype.constructor = pcbuilder.Formatter.Boardsie;

pcbuilder.Formatter.Boardsie.prototype.parse = function(basket, addLinks) {
    ret = {
        result: ""
    };

    if (basket.size() > 0) {
        txt = "[TABLE][B]Item[/B]|[B]qty[/B]|[B][/B]|[B]Price[/B]<br>";

        for (i = 0; i < basket.size(); i++) {

            line = basket.getLine(i);

            if (addLinks && line.url.length > 0) {
                txt += "[URL=\"";
                txt += line.url;
                txt += "\"]"
            }

            if (line.name && line.name.length > 0) {
                txt += line.name;
            } else {
                txt += "UNKNOWN";
            }

            if (addLinks && line.url.length > 0) {
                txt += "[/URL]"
            }

            txt += "|";
            if (line.quantity > 0) {
                txt += "[CENTER]";
                txt += line.quantity;
                txt += "[/CENTER]";
            }
            txt += "|";
            txt += basket.currency;
            txt += "|[RIGHT]";
            txt += line.price.toFixed(2);
            txt += "[/RIGHT]|<br>";
        }
        txt += "[B]Total[/B]|[B][/B]|" + basket.currency + "|[RIGHT]";
        txt += basket.total.toFixed(2) + "[/RIGHT][/TABLE]";
        ret.result = txt;
    } else {
        ret.error = {
            title: "Empty",
            message: "basket is empty"
        };
    }
    return ret;
};

pcbuilder.Formatter.Boardsie.prototype.HomeUrl = "http://www.boards.ie/vbulletin/forumdisplay.php?f=842";
pcbuilder.Formatter.Boardsie.prototype.HomeUrlPattern = "*://*.boards.ie/*";

// Reddit formatter
pcbuilder.Formatter.Reddit = function() {
    pcbuilder.Formatter.call(this, "Reddit", "Reddit formatter by github.com/tlowry/");
}

pcbuilder.Formatter.Reddit.prototype = Object.create(pcbuilder.Formatter.prototype);
pcbuilder.Formatter.Reddit.prototype.constructor = pcbuilder.Formatter.Reddit;

pcbuilder.Formatter.Reddit.prototype.parse = function(basket, addLinks) {
    ret = {
        result: ""
    };

    if (basket.size() > 0) {
        txt = "Item | qty ||Price <br> --|:--:|--|-:<br>";

        for (i = 0; i < basket.size(); i++) {

            line = basket.getLine(i);
            if (addLinks && line.url.length > 0) {
                txt += "[";
                txt += line.name;
                txt += "]";
            } else {
                txt += line.name;
            }
            if (addLinks && line.url.length > 0) {
                txt += "(";
                txt += line.url;
                txt += ")"
            }

            txt += "|";

            if (line.quantity > 0) {
                txt += line.quantity;
            }
            txt += "|";

            txt += basket.currency + "|";
            txt += line.price.toFixed(2) + "|";

            txt += "<br>";
        }

        txt += "Total| | " + basket.currency + "|" + basket.total.toFixed(2);

        ret.result = txt;
    } else {
        ret.error = {
            title: "Empty",
            message: "basket is empty"
        };
    }

    return ret;
};

pcbuilder.Formatter.Reddit.prototype.HomeUrl = "http://www.reddit.com/subreddits";
pcbuilder.Formatter.Reddit.prototype.HomeUrlPattern = "*://*.reddit.com/*";


// BBCode formatter
pcbuilder.Formatter.BBCode = function() {
    pcbuilder.Formatter.call(this, "BBCode", "BBCode formatter by github.com/tlowry/");
}

pcbuilder.Formatter.BBCode.prototype = Object.create(pcbuilder.Formatter.prototype);
pcbuilder.Formatter.BBCode.prototype.constructor = pcbuilder.Formatter.BBCode;

pcbuilder.Formatter.BBCode.prototype.parse = function(basket, addLinks) {
    ret = {
        result: ""
    };

    if (basket.size() > 0) {
        txt = "";

        for (i = 0; i < basket.size(); i++) {

            line = basket.getLine(i);

            if (line.quantity > 0) {
                txt += line.quantity + " x ";
            }

            if (addLinks && line.url.length > 0) {
                txt += "[url=";
                txt += line.url;
                txt += "]";
                txt += line.name;
                txt += "[/url]";
            } else {
                txt += line.name;
            }

            txt += " ";

            txt += " " + basket.currency + line.price.toFixed(2) + "<br>";

        }

        txt += "Total " + basket.currency + basket.total.toFixed(2);

        ret.result = txt;
    } else {
        ret.error = {
            title: "Empty",
            message: "basket is empty"
        };
    }

    return ret;
};

// BBCode Table formatter
pcbuilder.Formatter.BBTable = function() {
    pcbuilder.Formatter.call(this, "BBTable", "BBCode Table based formatter by github.com/tlowry/");
}

pcbuilder.Formatter.BBTable.prototype = Object.create(pcbuilder.Formatter.prototype);
pcbuilder.Formatter.BBTable.prototype.constructor = pcbuilder.Formatter.BBTable;

pcbuilder.Formatter.BBTable.prototype.parse = function(basket, addLinks) {
    ret = {
        result: ""
    };

    if (basket.size() > 0) {
        txt = "[table][tr][th]Item[/th][th]qty[/th][th]Price[/th][/tr]";

        for (i = 0; i < basket.size(); i++) {

            line = basket.getLine(i);
            txt += "[tr][td]";

            if (addLinks && line.url.length > 0) {
                txt += "[url=";
                txt += line.url;
                txt += "]";
                txt += line.name;
                txt += "[/url]";
            } else {
                txt += line.name;
            }

            txt += "[/td][td]";

            if (line.quantity > 0) {
                txt += line.quantity;
            }

            txt += "[/td][td]";
            txt += basket.currency + line.price.toFixed(2);
            txt += "[/td][/tr]";
        }

        txt += "[tr][td]Total[/td][td][/td][td]" + basket.currency + basket.total.toFixed(2);
        txt += "[/td][/tr][/table]";

        ret.result = txt;
    } else {
        ret.error = {
            title: "Empty",
            message: "basket is empty"
        };
    }

    return ret;
};

// Html formatter
pcbuilder.Formatter.Html = function() {
    pcbuilder.Formatter.call(this, "Html", "Html formatter by github.com/tlowry/");
}

pcbuilder.Formatter.Html.prototype = Object.create(pcbuilder.Formatter.prototype);
pcbuilder.Formatter.Html.prototype.constructor = pcbuilder.Formatter.Html;

pcbuilder.Formatter.Html.prototype.parse = function(basket, addLinks) {
    ret = {
        result: ""
    };

    if (basket.size() > 0) {
        txt = "<table><tr><th>Item</th><th>qty</th><th>Price</th></tr>";

        for (i = 0; i < basket.size(); i++) {

            line = basket.getLine(i);
            txt += "<tr><td>"
            if (addLinks && line.url.length > 0) {
                txt += "<a href=";
                txt += line.url;
                txt += ">";
                txt += line.name;
                txt += "</a>";
            } else {
                txt += line.name;
            }

            txt += "</td><td>";

            if (line.quantity > 0) {
                txt += line.quantity;
            }
            txt += "</td><td>";

            txt += basket.currency + line.price.toFixed(2);
            txt += "</td></tr>";
        }

        txt += "<tr><td>Total</td><td></td><td>" + basket.currency + basket.total.toFixed(2);
        txt += "</td></tr></table>";

        ret.result = txt;
    } else {
        ret.error = {
            title: "Empty",
            message: "basket is empty"
        };
    }

    return ret;
};

pcbuilder.Formatter.Html.prototype.render = function(basket, useLinks, node) {
    formatted = this.parse(basket, useLinks);
    text = pcbuilder.util.escapeHtml(formatted.result);
    node.setText(text);
}

pcbuilder.Formatter.Html.prototype.renderToClipBoard = function(basket, node) {
    text = pcbuilder.util.unEscapeHtml(node.getText());
    return text;
}

// Used to lookup an appropriate formatter for each site
pcbuilder.formatters = {
    "Boards.ie": pcbuilder.Formatter.Boardsie,
    "Reddit": pcbuilder.Formatter.Reddit,
    "BBCode": pcbuilder.Formatter.BBCode,
    "BBTable": pcbuilder.Formatter.BBTable,
    "Html": pcbuilder.Formatter.Html
};

/*	End Formatters*/
