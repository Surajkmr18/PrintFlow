/* =========================================
   PRINTFLOW - PRINTING BUSINESS APP
========================================= */


const STORAGE_KEY = "printing_business_orders";


/* GET SAVED ORDERS */

let orders = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || [];


/* HELPER */

function saveOrders() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(orders)
    );

}


/* MONEY */

function money(amount) {

    return "₹" + Number(amount || 0).toLocaleString("en-IN");

}


/* ESCAPE HTML */

function escapeHTML(text) {

    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   PAGE NAVIGATION
========================================= */

function showPage(pageName) {

    document.querySelectorAll(".page").forEach(function(page) {

        page.classList.remove("active");

    });


    document
        .getElementById(pageName)
        .classList.add("active");


    document.querySelectorAll(".nav-btn").forEach(function(button) {

        button.classList.remove("active");

    });


    document.querySelectorAll(".nav-btn").forEach(function(button) {

        if (
            button.getAttribute("onclick") ===
            `showPage('${pageName}')`
        ) {

            button.classList.add("active");

        }

    });


    const titles = {

        dashboard: "Dashboard",

        newOrder: "New Order",

        orders: "All Orders",

        customers: "Customers"

    };


    document.getElementById("pageTitle").innerText =
        titles[pageName] || "Dashboard";


    if (pageName === "dashboard") {

        updateDashboard();

    }


    if (pageName === "orders") {

        displayOrders();

    }


    if (pageName === "customers") {

        displayCustomers();

    }

}


/* =========================================
   CREATE ORDER
========================================= */

document
    .getElementById("orderForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();


        const customer =
            document.getElementById("customerName").value.trim();


        const phone =
            document.getElementById("customerPhone").value.trim();


        const product =
            document.getElementById("product").value;


        const quantity =
            Number(document.getElementById("quantity").value);


        const size =
            document.getElementById("size").value.trim();


        const material =
            document.getElementById("material").value.trim();


        const printing =
            document.getElementById("printing").value;


        const finishing =
            document.getElementById("finishing").value.trim();


        const deliveryDate =
            document.getElementById("deliveryDate").value;


        const total =
            Number(document.getElementById("totalAmount").value);


        const advance =
            Number(document.getElementById("advanceAmount").value);


        const status =
            document.getElementById("orderStatus").value;


        const notes =
            document.getElementById("notes").value.trim();


        /* VALIDATION */

        if (advance > total) {

            alert(
                "Advance amount total amount se zyada nahi ho sakta."
            );

            return;

        }


        /* CREATE ORDER ID */

        const orderID =
            "ORD-" +
            Date.now().toString().slice(-6);


        /* CREATE ORDER */

        const newOrder = {

            id: orderID,

            customer: customer,

            phone: phone,

            product: product,

            quantity: quantity,

            size: size,

            material: material,

            printing: printing,

            finishing: finishing,

            deliveryDate: deliveryDate,

            total: total,

            advance: advance,

            due: total - advance,

            status: status,

            notes: notes,

            createdAt: new Date().toISOString()

        };


        /* SAVE */

        orders.unshift(newOrder);

        saveOrders();


        /* RESET FORM */

        document
            .getElementById("orderForm")
            .reset();


        document.getElementById("advanceAmount").value = 0;


        /* SUCCESS */

        alert(
            "Order successfully create ho gaya!\n\nOrder ID: " +
            orderID
        );


        /* GO ORDERS */

        showPage("orders");

    });


/* =========================================
   DASHBOARD
========================================= */

function updateDashboard() {

    document.getElementById("totalOrders").innerText =
        orders.length;


    const pending =
        orders.filter(function(order) {

            return order.status !== "Delivered";

        }).length;


    document.getElementById("pendingOrders").innerText =
        pending;


    const ready =
        orders.filter(function(order) {

            return order.status === "Ready";

        }).length;


    document.getElementById("readyOrders").innerText =
        ready;


    const totalDue =
        orders.reduce(function(total, order) {

            return total + Number(order.due || 0);

        }, 0);


    document.getElementById("totalDue").innerText =
        money(totalDue);


    displayRecentOrders();

}


/* =========================================
   RECENT ORDERS
========================================= */

function displayRecentOrders() {

    const container =
        document.getElementById("recentOrders");


    const recent =
        orders.slice(0, 5);


    if (recent.length === 0) {

        container.className = "empty";

        container.innerHTML =
            "No orders yet.";

        return;

    }


    container.className = "";


    container.innerHTML =
        recent
            .map(function(order) {

                return createOrderHTML(order);

            })
            .join("");


    addViewButtons();

}


/* =========================================
   ALL ORDERS
========================================= */

function displayOrders() {

    const container =
        document.getElementById("ordersList");


    const search =
        document
            .getElementById("searchOrder")
            .value
            .toLowerCase();


    const status =
        document
            .getElementById("filterStatus")
            .value;


    const filtered =
        orders.filter(function(order) {

            const searchText = (

                order.id +
                " " +
                order.customer +
                " " +
                order.phone +
                " " +
                order.product

            ).toLowerCase();


            const matchesSearch =
                searchText.includes(search);


            const matchesStatus =
                !status ||
                order.status === status;


            return matchesSearch && matchesStatus;

        });


    if (filtered.length === 0) {

        container.innerHTML =
            '<div class="empty">No orders found.</div>';

        return;

    }


    container.innerHTML =
        filtered
            .map(function(order) {

                return createOrderHTML(order);

            })
            .join("");


    addViewButtons();

}


/* =========================================
   ORDER HTML
========================================= */

function createOrderHTML(order) {

    let badgeClass = "";


    if (order.status === "Ready") {

        badgeClass = "ready";

    }


    if (order.status === "Printing") {

        badgeClass = "printing";

    }


    if (order.status === "Delivered") {

        badgeClass = "delivered";

    }


    return `

        <div class="order-row">

            <div>

                <strong>
                    ${escapeHTML(order.id)}
                </strong>

                <br>

                <small>
                    ${escapeHTML(order.customer)}
                    •
                    ${escapeHTML(order.phone)}
                </small>

            </div>


            <div>

                <strong>
                    ${escapeHTML(order.product)}
                </strong>

                <br>

                <small>
                    ${order.quantity} pcs
                </small>

            </div>


            <div>

                <span class="badge ${badgeClass}">
                    ${escapeHTML(order.status)}
                </span>

            </div>


            <div class="amount">

                <strong>
                    ${money(order.total)}
                </strong>

                <small>

                    ${
                        order.due > 0
                            ? money(order.due) + " due"
                            : "Paid"
                    }

                </small>

            </div>


            <button
                class="order-view-btn"
                data-id="${order.id}"
            >
                View
            </button>

        </div>

    `;

}


/* =========================================
   VIEW BUTTON
========================================= */

function addViewButtons() {

    document
        .querySelectorAll(".order-view-btn")
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    openOrder(
                        button.dataset.id
                    );

                }
            );

        });

}


/* =========================================
   ORDER DETAILS
========================================= */

function openOrder(orderID) {

    const order =
        orders.find(function(item) {

            return item.id === orderID;

        });


    if (!order) {

        return;

    }


    const details =
        document.getElementById("orderDetails");


    details.innerHTML = `

        <p
            style="
                color:#2563eb;
                font-weight:bold;
            "
        >
            ${escapeHTML(order.id)}
        </p>


        <h2>
            ${escapeHTML(order.customer)}
        </h2>


        <p style="color:#737983;margin-top:5px">

            ${escapeHTML(order.phone)}

        </p>


        <div class="detail-grid">

            ${detailItem(
                "Product",
                order.product
            )}

            ${detailItem(
                "Quantity",
                order.quantity + " pcs"
            )}

            ${detailItem(
                "Size",
                order.size
            )}

            ${detailItem(
                "Material",
                order.material
            )}

            ${detailItem(
                "Printing",
                order.printing
            )}

            ${detailItem(
                "Finishing",
                order.finishing
            )}

            ${detailItem(
                "Delivery Date",
                order.deliveryDate || "Not set"
            )}

            ${detailItem(
                "Total",
                money(order.total)
            )}

            ${detailItem(
                "Advance",
                money(order.advance)
            )}

            ${detailItem(
                "Due",
                money(order.due)
            )}

        </div>


        ${
            order.notes
            ?
            detailItem(
                "Notes",
                order.notes
            )
            :
            ""
        }


        <div class="status-area">

            <label>

                Update Status

                <select id="modalStatus">

                    <option
                        ${
                            order.status === "New"
                            ? "selected"
                            : ""
                        }
                    >
                        New
                    </option>

                    <option
                        ${
                            order.status === "Designing"
                            ? "selected"
                            : ""
                        }
                    >
                        Designing
                    </option>

                    <option
                        ${
                            order.status === "Customer Approval"
                            ? "selected"
                            : ""
                        }
                    >
                        Customer Approval
                    </option>

                    <option
                        ${
                            order.status === "Printing"
                            ? "selected"
                            : ""
                        }
                    >
                        Printing
                    </option>

                    <option
                        ${
                            order.status === "Quality Check"
                            ? "selected"
                            : ""
                        }
                    >
                        Quality Check
                    </option>

                    <option
                        ${
                            order.status === "Ready"
                            ? "selected"
                            : ""
                        }
                    >
                        Ready
                    </option>

                    <option
                        ${
                            order.status === "Delivered"
                            ? "selected"
                            : ""
                        }
                    >
                        Delivered
                    </option>

                </select>

            </label>


            <button
                class="save-btn"
                onclick="updateOrderStatus('${order.id}')"
            >
                Update
            </button>


            <button
                class="delete-btn"
                onclick="deleteOrder('${order.id}')"
            >
                Delete
            </button>

        </div>

    `;


    document
        .getElementById("orderModal")
        .classList.add("show");

}


/* =========================================
   DETAIL ITEM
========================================= */

function detailItem(title, value) {

    return `

        <div class="detail-item">

            <span>
                ${title}
            </span>

            <strong>
                ${escapeHTML(value || "—")}
            </strong>

        </div>

    `;

}


/* =========================================
   UPDATE STATUS
========================================= */

function updateOrderStatus(orderID) {

    const order =
        orders.find(function(item) {

            return item.id === orderID;

        });


    if (!order) {

        return;

    }


    const newStatus =
        document.getElementById("modalStatus").value;


    order.status = newStatus;


    saveOrders();


    closeModal();


    updateDashboard();


    displayOrders();

}


/* =========================================
   DELETE ORDER
========================================= */

function deleteOrder(orderID) {

    const confirmDelete =
        confirm(
            "Kya aap ye order delete karna chahte ho?"
        );


    if (!confirmDelete) {

        return;

    }


    orders =
        orders.filter(function(order) {

            return order.id !== orderID;

        });


    saveOrders();


    closeModal();


    updateDashboard();


    displayOrders();


    alert("Order delete ho gaya.");

}


/* =========================================
   CUSTOMERS
========================================= */

function displayCustomers() {

    const container =
        document.getElementById("customerList");


    const customerMap = new Map();


    orders.forEach(function(order) {

        if (!customerMap.has(order.phone)) {

            customerMap.set(

                order.phone,

                {

                    name: order.customer,

                    phone: order.phone,

                    orders: 1

                }

            );

        } else {

            customerMap.get(
                order.phone
            ).orders++;

        }

    });


    const customers =
        Array.from(customerMap.values());


    if (customers.length === 0) {

        container.innerHTML =
            '<div class="empty">No customers yet.</div>';

        return;

    }


    container.className =
        "customer-grid";


    container.innerHTML =
        customers
            .map(function(customer) {

                return `

                    <div class="customer-card">

                        <strong>
                            ${escapeHTML(
                                customer.name
                            )}
                        </strong>

                        <span>

                            ${escapeHTML(
                                customer.phone
                            )}

                            •

                            ${customer.orders}

                            order

                        </span>

                    </div>

                `;

            })
            .join("");

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeModal() {

    document
        .getElementById("orderModal")
        .classList.remove("show");

}


/* CLOSE MODAL BY CLICKING OUTSIDE */

document
    .getElementById("orderModal")
    .addEventListener(
        "click",
        function(event) {

            if (
                event.target.id === "orderModal"
            ) {

                closeModal();

            }

        }
    );


/* =========================================
   START APP
========================================= */

updateDashboard();