


/* =========================================================
   1. SUPABASE CONFIG
=========================================================

   IMPORTANT:
   Yahan apne Supabase Project URL aur Publishable Key
   paste karo.

   Example:

   const SUPABASE_URL = "https://xxxxx.supabase.co";
   const SUPABASE_KEY = "eyJhbGciOi...";

   Secret / service-role key YAHAN MAT LAGANA.
========================================================= */

const SUPABASE_URL = "https://nmdtgvybajzbdvvufvip.supabase.co";
const SUPABASE_KEY = "sb_publishable_I4iqYfmDKTxBWNxuHM4wBg_5wG6yXlJ";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let orders = [];

let currentInvoiceOrder = null;


/* =========================================================
   BASIC FUNCTIONS
========================================================= */

function money(amount) {

    return "₹" + Number(amount || 0).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2
        }
    );
}


function escapeHTML(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function generateOrderID() {

    return "ORD-" +
        Date.now().toString().slice(-6);
}


function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageName, clickedButton = null) {

    document.querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });


    const page =
        document.getElementById(pageName);


    if (page) {
        page.classList.add("active");
    }


    document.querySelectorAll(".nav-btn")
        .forEach(button => {
            button.classList.remove("active");
        });


    if (clickedButton) {

        clickedButton.classList.add("active");

    } else {

        document.querySelectorAll(".nav-btn")
            .forEach(button => {

                const onclick =
                    button.getAttribute("onclick") || "";

                if (
                    onclick.includes(`'${pageName}'`)
                ) {
                    button.classList.add("active");
                }

            });
    }


    if (pageName === "dashboard") {
        updateDashboard();
    }


    if (pageName === "orders") {
        renderOrders();
    }


    if (pageName === "customers") {
        renderCustomers();
    }
}


/* =========================================================
   LOAD ORDERS FROM SUPABASE
========================================================= */

async function loadOrders() {

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("orders")
            .select("*")
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Supabase Load Error:",
                error
            );

            alert(
                "Orders load nahi ho pa rahe.\n\n" +
                error.message
            );

            return;
        }


        orders = data || [];


        updateDashboard();

        renderOrders();

        renderCustomers();


    } catch (error) {

        console.error(error);

        alert(
            "Database connection error."
        );
    }
}


/* =========================================================
   NEW ORDER FORM
========================================================= */

orderForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const total =
            Number(
                document.getElementById(
                    "totalAmount"
                ).value
            ) || 0;

        let advance =
            Number(
                document.getElementById(
                    "advanceAmount"
                ).value
            ) || 0;

        if (advance > total) {

            alert(
                "Advance amount total amount se zyada nahi ho sakta."
            );

            return;
        }

        const orderID =
            generateOrderID();

        const newOrder = {

            order_id: orderID,

            customer:
                document.getElementById(
                    "customerName"
                ).value.trim(),

            phone:
                document.getElementById(
                    "customerPhone"
                ).value.trim(),

            product:
                document.getElementById(
                    "product"
                ).value,

            quantity:
                Number(
                    document.getElementById(
                        "quantity"
                    ).value
                ) || 1,

            size:
                document.getElementById(
                    "size"
                ).value.trim(),

            material:
                document.getElementById(
                    "material"
                ).value.trim(),

            printing:
                document.getElementById(
                    "printing"
                ).value,

            finishing:
                document.getElementById(
                    "finishing"
                ).value.trim(),

            delivery_date:
                document.getElementById(
                    "deliveryDate"
                ).value || null,

            total: total,

            advance: advance,

            due: total - advance,

            status:
                document.getElementById(
                    "orderStatus"
                ).value,

            notes:
                document.getElementById(
                    "notes"
                ).value.trim()

        };


        try {

            const {
                data,
                error
            } = await supabaseClient
                .from("orders")
                .insert([newOrder])
                .select()
                .single();


            if (error) {

                console.error(
                    "Supabase Insert Error:",
                    error
                );

                alert(
                    "Order save nahi hua.\n\n" +
                    error.message
                );

                return;
            }


            orders.unshift(data);


            alert(
                "Order successfully save ho gaya!\n\n" +
                "Order ID: " +
                orderID
            );


        } catch (error) {

            console.error(
                "Order save error:",
                error
            );

            alert(
                "Order save karte waqt error aa gaya.\n\n" +
                (error.message || "Unknown error")
            );

        }

    }
);


/* =========================================================
   DUE PREVIEW
========================================================= */

function updateDuePreview() {

    const total =
        Number(
            document.getElementById(
                "totalAmount"
            ).value
        ) || 0;


    const advance =
        Number(
            document.getElementById(
                "advanceAmount"
            ).value
        ) || 0;


    const due =
        Math.max(
            total - advance,
            0
        );


    document.getElementById(
        "duePreview"
    ).textContent = money(due);
}


document.getElementById(
    "totalAmount"
).addEventListener(
    "input",
    updateDuePreview
);


document.getElementById(
    "advanceAmount"
).addEventListener(
    "input",
    updateDuePreview
);


/* =========================================================
   RESET FORM
========================================================= */

function resetOrderForm() {

    orderForm.reset();


    document.getElementById(
        "quantity"
    ).value = 1;


    document.getElementById(
        "advanceAmount"
    ).value = 0;


    document.getElementById(
        "orderStatus"
    ).value = "Pending";


    updateDuePreview();
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const totalOrders =
        orders.length;


    const pendingOrders =
        orders.filter(order =>
            order.status === "Pending" ||
            order.status === "In Progress"
        ).length;


    const readyOrders =
        orders.filter(order =>
            order.status === "Ready"
        ).length;


    const amountDue =
        orders.reduce(
            (sum, order) =>
                sum +
                Number(order.due || 0),
            0
        );


    document.getElementById(
        "totalOrders"
    ).textContent =
        totalOrders;


    document.getElementById(
        "pendingOrders"
    ).textContent =
        pendingOrders;


    document.getElementById(
        "readyOrders"
    ).textContent =
        readyOrders;


    document.getElementById(
        "amountDue"
    ).textContent =
        money(amountDue);


    renderRecentOrders();
}


/* =========================================================
   RECENT ORDERS
========================================================= */

function renderRecentOrders() {

    const container =
        document.getElementById(
            "recentOrders"
        );


    if (!orders.length) {

        container.innerHTML = `
            <div class="empty">
                No orders yet.<br>
                Create your first order.
            </div>
        `;

        return;
    }


    const recent =
        orders.slice(0, 5);


    container.innerHTML =
        recent.map(order =>
            orderRowHTML(
                order,
                false
            )
        ).join("");
}


/* =========================================================
   ALL ORDERS
========================================================= */

function renderOrders() {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (!container) {
        return;
    }


    const searchInput =
        document.getElementById(
            "searchOrder"
        );


    const filterInput =
        document.getElementById(
            "filterStatus"
        );


    const search =
        (
            searchInput?.value || ""
        )
        .toLowerCase()
        .trim();


    const filter =
        filterInput?.value || "";


    const filtered =
        orders.filter(order => {

            const matchesSearch =

                !search ||

                String(order.order_id || "")
                    .toLowerCase()
                    .includes(search) ||

                String(order.customer || "")
                    .toLowerCase()
                    .includes(search) ||

                String(order.phone || "")
                    .toLowerCase()
                    .includes(search) ||

                String(order.product || "")
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                !filter ||
                order.status === filter;


            return (
                matchesSearch &&
                matchesStatus
            );
        });


    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty">
                No matching orders found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        filtered.map(order =>
            orderRowHTML(
                order,
                true
            )
        ).join("");
}


/* =========================================================
   ORDER ROW
========================================================= */

function orderRowHTML(
    order,
    showActions = false
) {

    const statusClass =
        String(order.status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");


    return `

        <div class="order-row">

            <div class="order-main">

                <div class="order-id">
                    ${escapeHTML(
                        order.order_id
                    )}
                </div>


                <div class="order-name">
                    ${escapeHTML(
                        order.customer
                    )}
                </div>


                <div class="order-meta">

                    ${escapeHTML(
                        order.product
                    )}

                    • Qty ${order.quantity}

                    ${
                        order.delivery_date
                        ?
                        `
                        • Delivery:
                        ${escapeHTML(
                            formatDate(
                                order.delivery_date
                            )
                        )}
                        `
                        :
                        ""
                    }

                </div>

            </div>


            <div>

                <span
                    class="badge ${statusClass}"
                >
                    ${escapeHTML(
                        order.status
                    )}
                </span>

            </div>


            <div class="order-money">

                <div class="order-total">
                    ${money(
                        order.total
                    )}
                </div>

                <div class="order-due">
                    Due:
                    ${money(
                        order.due
                    )}
                </div>

            </div>


            ${
                showActions
                ?
                `

                <div class="order-actions">

                    <button
                        class="small-btn"
                        onclick="viewOrder('${order.order_id}')"
                    >
                        View
                    </button>


                    <button
                        class="small-btn"
                        onclick="openInvoice('${order.order_id}')"
                    >
                        Invoice
                    </button>


                    <button
                        class="small-btn"
                        onclick="sendOrderWhatsApp('${order.order_id}')"
                    >
                        WhatsApp
                    </button>


                    <button
                        class="small-btn"
                        onclick="changeStatus('${order.order_id}')"
                    >
                        Status
                    </button>


                    <button
                        class="small-btn"
                        onclick="deleteOrder('${order.order_id}')"
                    >
                        Delete
                    </button>

                </div>

                `
                :
                ""
            }

        </div>
    `;
}


/* =========================================================
   VIEW ORDER
========================================================= */

function viewOrder(orderID) {

    const order =
        orders.find(item =>
            item.order_id === orderID
        );


    if (!order) {
        return;
    }


    const details =
        document.getElementById(
            "orderDetails"
        );


    details.innerHTML = `

        <div class="detail-grid">

            <div class="detail-item">
                <span>Order ID</span>
                <strong>
                    ${escapeHTML(
                        order.order_id
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Status</span>
                <strong>
                    ${escapeHTML(
                        order.status
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Customer</span>
                <strong>
                    ${escapeHTML(
                        order.customer
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Mobile</span>
                <strong>
                    ${escapeHTML(
                        order.phone
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Product</span>
                <strong>
                    ${escapeHTML(
                        order.product
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Quantity</span>
                <strong>
                    ${order.quantity}
                </strong>
            </div>


            <div class="detail-item">
                <span>Size</span>
                <strong>
                    ${escapeHTML(
                        order.size || "-"
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Material</span>
                <strong>
                    ${escapeHTML(
                        order.material || "-"
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Printing</span>
                <strong>
                    ${escapeHTML(
                        order.printing || "-"
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Finishing</span>
                <strong>
                    ${escapeHTML(
                        order.finishing || "-"
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Delivery Date</span>
                <strong>
                    ${formatDate(
                        order.delivery_date
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Total Amount</span>
                <strong>
                    ${money(
                        order.total
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Advance</span>
                <strong>
                    ${money(
                        order.advance
                    )}
                </strong>
            </div>


            <div class="detail-item">
                <span>Amount Due</span>
                <strong>
                    ${money(
                        order.due
                    )}
                </strong>
            </div>

        </div>


        ${
            order.notes
            ?
            `
            <div
                class="detail-item"
                style="margin-top:15px;"
            >

                <span>Notes</span>

                <strong>
                    ${escapeHTML(
                        order.notes
                    )}
                </strong>

            </div>
            `
            :
            ""
        }

    `;


    document
        .getElementById("orderModal")
        .classList.add("show");
}


function closeModal() {

    document
        .getElementById("orderModal")
        .classList.remove("show");
}


/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeStatus(orderID) {

    const order =
        orders.find(item =>
            item.order_id === orderID
        );


    if (!order) {
        return;
    }


    const statuses = [
        "Pending",
        "In Progress",
        "Ready",
        "Delivered",
        "Cancelled"
    ];


    const currentIndex =
        statuses.indexOf(
            order.status
        );


    const nextIndex =
        (
            currentIndex + 1
        ) % statuses.length;


    const newStatus =
        statuses[nextIndex];


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("orders")
            .update({
                status: newStatus
            })
            .eq(
                "order_id",
                orderID
            )
            .select()
            .single();


        if (error) {

            console.error(error);

            alert(
                "Status update nahi hua.\n\n" +
                error.message
            );

            return;
        }


        const index =
            orders.findIndex(item =>
                item.order_id === orderID
            );


        if (index !== -1) {
            orders[index] = data;
        }


        updateDashboard();

        renderOrders();


    } catch (error) {

        console.error(error);

        alert(
            "Status update error."
        );
    }
}


/* =========================================================
   DELETE ORDER
========================================================= */

async function deleteOrder(orderID) {

    const order =
        orders.find(item =>
            item.order_id === orderID
        );


    if (!order) {
        return;
    }


    const confirmDelete =
        confirm(
            `Delete order ${orderID}?`
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient
            .from("orders")
            .delete()
            .eq(
                "order_id",
                orderID
            );


        if (error) {

            console.error(error);

            alert(
                "Order delete nahi hua.\n\n" +
                error.message
            );

            return;
        }


        orders =
            orders.filter(item =>
                item.order_id !== orderID
            );


        updateDashboard();

        renderOrders();

        renderCustomers();


    } catch (error) {

        console.error(error);

        alert(
            "Delete karte waqt error aa gaya."
        );
    }
}


/* =========================================================
   CUSTOMERS
========================================================= */

function renderCustomers() {

    const container =
        document.getElementById(
            "customerList"
        );


    if (!container) {
        return;
    }


    const customerMap = {};


    orders.forEach(order => {

        const key =
            order.phone ||
            order.customer;


        if (!customerMap[key]) {

            customerMap[key] = {

                name:
                    order.customer,

                phone:
                    order.phone,

                orders: 0,

                total: 0,

                due: 0

            };
        }


        customerMap[key].orders++;


        customerMap[key].total +=
            Number(
                order.total || 0
            );


        customerMap[key].due +=
            Number(
                order.due || 0
            );

    });


    const customers =
        Object.values(
            customerMap
        );


    if (!customers.length) {

        container.innerHTML = `

            <div class="section-card empty">
                No customers yet.
            </div>

        `;

        return;
    }


    container.innerHTML =
        customers.map(customer => `

            <div class="customer-card">

                <h3>
                    ${escapeHTML(
                        customer.name
                    )}
                </h3>


                <p>
                    📱
                    ${escapeHTML(
                        customer.phone || "-"
                    )}
                </p>


                <p>
                    📦 Orders:
                    ${customer.orders}
                </p>


                <p>
                    💰 Total:
                    ${money(
                        customer.total
                    )}
                </p>


                <p>
                    🔴 Due:
                    ${money(
                        customer.due
                    )}
                </p>

            </div>

        `).join("");
}


/* =========================================================
   INVOICE
========================================================= */

function openInvoice(orderID) {

    const order =
        orders.find(item =>
            item.order_id === orderID
        );


    if (!order) {
        return;
    }


    currentInvoiceOrder =
        order;


    const invoice =
        document.getElementById(
            "invoiceContent"
        );


    invoice.innerHTML = `

        <div class="invoice">

            <div class="invoice-top">

                <div>

                    <div class="business-name">
                        Your Printing Business
                    </div>


                    <div class="business-info">

                        Printing & Design Services<br>

                        Your Address, City<br>

                        Mobile: +91 XXXXX XXXXX

                    </div>

                </div>


                <div class="invoice-title">

                    <h1>INVOICE</h1>


                    <p>
                        Invoice:
                        ${escapeHTML(
                            order.order_id
                        )}
                    </p>


                    <p>
                        Date:
                        ${
                            order.created_at
                            ?
                            new Date(
                                order.created_at
                            ).toLocaleDateString(
                                "en-IN"
                            )
                            :
                            "-"
                        }
                    </p>

                </div>

            </div>


            <div class="invoice-customer">

                <div>

                    <h4>BILL TO</h4>

                    <p>

                        <strong>
                            ${escapeHTML(
                                order.customer
                            )}
                        </strong>

                        <br>

                        ${escapeHTML(
                            order.phone
                        )}

                    </p>

                </div>


                <div>

                    <h4>ORDER STATUS</h4>

                    <p>
                        ${escapeHTML(
                            order.status
                        )}
                    </p>


                    ${
                        order.delivery_date
                        ?
                        `
                        <p>
                            Delivery:
                            ${formatDate(
                                order.delivery_date
                            )}
                        </p>
                        `
                        :
                        ""
                    }

                </div>

            </div>


            <table class="invoice-table">

                <thead>

                    <tr>

                        <th>
                            Product
                        </th>

                        <th>
                            Details
                        </th>

                        <th>
                            Qty
                        </th>

                        <th>
                            Amount
                        </th>

                    </tr>

                </thead>


                <tbody>

                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    order.product
                                )}
                            </strong>

                        </td>


                        <td>

                            ${escapeHTML(
                                order.size || "-"
                            )}

                            <br>

                            ${escapeHTML(
                                order.material || "-"
                            )}

                            <br>

                            ${escapeHTML(
                                order.printing || "-"
                            )}

                            ${
                                order.finishing
                                ?
                                `
                                <br>
                                ${escapeHTML(
                                    order.finishing
                                )}
                                `
                                :
                                ""
                            }

                        </td>


                        <td>
                            ${order.quantity}
                        </td>


                        <td>
                            ${money(
                                order.total
                            )}
                        </td>

                    </tr>

                </tbody>

            </table>


            <div class="invoice-summary">

                <div class="summary-row">

                    <span>
                        Total
                    </span>

                    <strong>
                        ${money(
                            order.total
                        )}
                    </strong>

                </div>


                <div class="summary-row">

                    <span>
                        Advance Paid
                    </span>

                    <strong>
                        ${money(
                            order.advance
                        )}
                    </strong>

                </div>


                <div class="summary-row due">

                    <span>
                        Amount Due
                    </span>

                    <strong>
                        ${money(
                            order.due
                        )}
                    </strong>

                </div>


                <div class="summary-row total">

                    <span>
                        Payable
                    </span>

                    <strong>
                        ${money(
                            order.due
                        )}
                    </strong>

                </div>

            </div>


            ${
                order.notes
                ?
                `
                <div
                    style="
                        margin-top:25px;
                        font-size:13px;
                    "
                >

                    <strong>
                        Notes:
                    </strong>

                    ${escapeHTML(
                        order.notes
                    )}

                </div>
                `
                :
                ""
            }


            <div class="invoice-footer">

                Thank you for your business!<br>

                This is a computer generated invoice.

            </div>

        </div>

    `;


    document
        .getElementById(
            "invoiceModal"
        )
        .classList.add("show");
}


function closeInvoice() {

    document
        .getElementById(
            "invoiceModal"
        )
        .classList.remove("show");


    currentInvoiceOrder =
        null;
}


/* =========================================================
   PRINT INVOICE
========================================================= */

function printInvoice() {

    if (!currentInvoiceOrder) {
        return;
    }


    window.print();
}


/* =========================================================
   WHATSAPP
========================================================= */

function sendWhatsApp() {

    if (!currentInvoiceOrder) {
        return;
    }


    sendOrderWhatsApp(
        currentInvoiceOrder.order_id
    );
}


function sendOrderWhatsApp(orderID) {

    const order =
        orders.find(item =>
            item.order_id === orderID
        );


    if (!order) {
        return;
    }


    let phone =
        String(
            order.phone || ""
        )
        .replace(/\D/g, "");


    if (phone.length === 10) {
        phone = "91" + phone;
    }


    if (!phone) {

        alert(
            "Customer ka mobile number nahi hai."
        );

        return;
    }


    const message =

`Hello ${order.customer},

Your printing order has been received.

Order ID: ${order.order_id}
Product: ${order.product}
Quantity: ${order.quantity}
Status: ${order.status}

Total Amount: ${money(order.total)}
Advance Paid: ${money(order.advance)}
Amount Due: ${money(order.due)}

${
    order.delivery_date
    ?
    "Delivery Date: " +
    formatDate(order.delivery_date)
    :
    ""
}

Thank you for your business.`;


    const url =
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(
            message
        );


    window.open(
        url,
        "_blank"
    );
}


/* =========================================================
   MODAL BACKGROUND CLOSE
========================================================= */

window.addEventListener(
    "click",
    function(event) {

        const orderModal =
            document.getElementById(
                "orderModal"
            );


        const invoiceModal =
            document.getElementById(
                "invoiceModal"
            );


        if (
            event.target ===
            orderModal
        ) {
            closeModal();
        }


        if (
            event.target ===
            invoiceModal
        ) {
            closeInvoice();
        }

    }
);


/* =========================================================
   START APPLICATION
========================================================= */

async function startApp() {

    console.log(
        "PrintFlow starting..."
    );


    if (
        SUPABASE_URL.includes(
            "YAHAN_APNA"
        ) ||
        SUPABASE_KEY.includes(
            "YAHAN_APNI"
        )
    ) {

        alert(
            "Pehle app.js mein Supabase URL aur Publishable Key add karo."
        );

        return;
    }


    await loadOrders();


    updateDuePreview();
}


startApp();