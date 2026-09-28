const STORAGE_KEY = "printing_business_orders";

let orders = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
);

let currentInvoiceOrder = null;


/* =========================
   BASIC FUNCTIONS
========================= */

function saveOrders() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(orders)
    );
}


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


/* =========================
   PAGE NAVIGATION
========================= */

function showPage(pageName, clickedButton = null) {

    document.querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });

    const page = document.getElementById(pageName);

    if (page) {
        page.classList.add("active");
    }


    document.querySelectorAll(".nav-btn")
        .forEach(btn => {
            btn.classList.remove("active");
        });


    if (clickedButton) {

        clickedButton.classList.add("active");

    } else {

        document.querySelectorAll(".nav-btn")
            .forEach(btn => {

                if (
                    btn.getAttribute("onclick") &&
                    btn.getAttribute("onclick")
                        .includes(`'${pageName}'`)
                ) {
                    btn.classList.add("active");
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


/* =========================
   ORDER FORM
========================= */

const orderForm =
    document.getElementById("orderForm");


orderForm.addEventListener("submit", function(event) {

    event.preventDefault();


    const total =
        Number(document.getElementById("totalAmount").value) || 0;

    let advance =
        Number(document.getElementById("advanceAmount").value) || 0;


    if (advance > total) {
        alert("Advance amount cannot be greater than total amount.");
        return;
    }


    const order = {

        id: generateOrderID(),

        customer:
            document.getElementById("customerName").value.trim(),

        phone:
            document.getElementById("customerPhone").value.trim(),

        product:
            document.getElementById("product").value,

        quantity:
            Number(document.getElementById("quantity").value) || 1,

        size:
            document.getElementById("size").value.trim(),

        material:
            document.getElementById("material").value.trim(),

        printing:
            document.getElementById("printing").value,

        finishing:
            document.getElementById("finishing").value.trim(),

        deliveryDate:
            document.getElementById("deliveryDate").value,

        total: total,

        advance: advance,

        due: total - advance,

        status:
            document.getElementById("orderStatus").value,

        notes:
            document.getElementById("notes").value.trim(),

        createdAt:
            new Date().toISOString()

    };


    orders.unshift(order);

    saveOrders();

    alert(
        "Order saved successfully!\n\nOrder ID: " +
        order.id
    );


    resetOrderForm();

    updateDashboard();

    showPage("orders");
});


/* =========================
   DUE PREVIEW
========================= */

function updateDuePreview() {

    const total =
        Number(document.getElementById("totalAmount").value) || 0;

    const advance =
        Number(document.getElementById("advanceAmount").value) || 0;

    const due =
        Math.max(total - advance, 0);

    document.getElementById("duePreview")
        .textContent = money(due);
}


document.getElementById("totalAmount")
    .addEventListener("input", updateDuePreview);

document.getElementById("advanceAmount")
    .addEventListener("input", updateDuePreview);


/* =========================
   RESET FORM
========================= */

function resetOrderForm() {

    orderForm.reset();

    document.getElementById("quantity").value = 1;

    document.getElementById("advanceAmount").value = 0;

    document.getElementById("orderStatus").value = "Pending";

    updateDuePreview();
}


/* =========================
   DASHBOARD
========================= */

function updateDashboard() {

    document.getElementById("totalOrders")
        .textContent = orders.length;


    const pending =
        orders.filter(order =>
            order.status === "Pending" ||
            order.status === "In Progress"
        ).length;


    const ready =
        orders.filter(order =>
            order.status === "Ready"
        ).length;


    const due =
        orders.reduce(
            (sum, order) =>
                sum + Number(order.due || 0),
            0
        );


    document.getElementById("pendingOrders")
        .textContent = pending;

    document.getElementById("readyOrders")
        .textContent = ready;

    document.getElementById("amountDue")
        .textContent = money(due);


    renderRecentOrders();
}


/* =========================
   RECENT ORDERS
========================= */

function renderRecentOrders() {

    const container =
        document.getElementById("recentOrders");


    if (orders.length === 0) {

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
            orderRowHTML(order)
        ).join("");
}


/* =========================
   ALL ORDERS
========================= */

function renderOrders() {

    const container =
        document.getElementById("ordersList");

    const search =
        (document.getElementById("searchOrder")?.value || "")
            .toLowerCase()
            .trim();

    const filter =
        document.getElementById("filterStatus")?.value || "";


    let filtered = orders.filter(order => {

        const matchesSearch =
            !search ||
            order.id.toLowerCase().includes(search) ||
            order.customer.toLowerCase().includes(search) ||
            order.phone.toLowerCase().includes(search) ||
            order.product.toLowerCase().includes(search);


        const matchesStatus =
            !filter ||
            order.status === filter;


        return matchesSearch && matchesStatus;
    });


    if (filtered.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No matching orders found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        filtered.map(order =>
            orderRowHTML(order, true)
        ).join("");
}


/* =========================
   ORDER ROW
========================= */

function orderRowHTML(order, showActions = false) {

    const statusClass =
        order.status
            .toLowerCase()
            .replace(/\s+/g, "-");


    return `

        <div class="order-row">

            <div class="order-main">

                <div class="order-id">
                    ${escapeHTML(order.id)}
                </div>

                <div class="order-name">
                    ${escapeHTML(order.customer)}
                </div>

                <div class="order-meta">

                    ${escapeHTML(order.product)}
                    • Qty ${order.quantity}

                    ${order.deliveryDate
                        ? ` • Delivery: ${escapeHTML(formatDate(order.deliveryDate))}`
                        : ""
                    }

                </div>

            </div>


            <div>

                <span class="badge ${statusClass}">
                    ${escapeHTML(order.status)}
                </span>

            </div>


            <div class="order-money">

                <div class="order-total">
                    ${money(order.total)}
                </div>

                <div class="order-due">
                    Due: ${money(order.due)}
                </div>

            </div>


            ${
                showActions
                ?
                `
                <div class="order-actions">

                    <button
                        class="small-btn"
                        onclick="viewOrder('${order.id}')"
                    >
                        View
                    </button>

                    <button
                        class="small-btn"
                        onclick="openInvoice('${order.id}')"
                    >
                        Invoice
                    </button>

                    <button
                        class="small-btn"
                        onclick="sendOrderWhatsApp('${order.id}')"
                    >
                        WhatsApp
                    </button>

                    <button
                        class="small-btn"
                        onclick="changeStatus('${order.id}')"
                    >
                        Status
                    </button>

                    <button
                        class="small-btn"
                        onclick="deleteOrder('${order.id}')"
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


/* =========================
   DATE
========================= */

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================
   VIEW ORDER
========================= */

function viewOrder(orderID) {

    const order =
        orders.find(item =>
            item.id === orderID
        );


    if (!order) {
        return;
    }


    const details =
        document.getElementById("orderDetails");


    details.innerHTML = `

        <div class="detail-grid">

            <div class="detail-item">
                <span>Order ID</span>
                <strong>${escapeHTML(order.id)}</strong>
            </div>

            <div class="detail-item">
                <span>Status</span>
                <strong>${escapeHTML(order.status)}</strong>
            </div>

            <div class="detail-item">
                <span>Customer</span>
                <strong>${escapeHTML(order.customer)}</strong>
            </div>

            <div class="detail-item">
                <span>Mobile</span>
                <strong>${escapeHTML(order.phone)}</strong>
            </div>

            <div class="detail-item">
                <span>Product</span>
                <strong>${escapeHTML(order.product)}</strong>
            </div>

            <div class="detail-item">
                <span>Quantity</span>
                <strong>${order.quantity}</strong>
            </div>

            <div class="detail-item">
                <span>Size</span>
                <strong>${escapeHTML(order.size || "-")}</strong>
            </div>

            <div class="detail-item">
                <span>Material</span>
                <strong>${escapeHTML(order.material || "-")}</strong>
            </div>

            <div class="detail-item">
                <span>Printing</span>
                <strong>${escapeHTML(order.printing || "-")}</strong>
            </div>

            <div class="detail-item">
                <span>Finishing</span>
                <strong>${escapeHTML(order.finishing || "-")}</strong>
            </div>

            <div class="detail-item">
                <span>Delivery Date</span>
                <strong>${formatDate(order.deliveryDate)}</strong>
            </div>

            <div class="detail-item">
                <span>Total Amount</span>
                <strong>${money(order.total)}</strong>
            </div>

            <div class="detail-item">
                <span>Advance</span>
                <strong>${money(order.advance)}</strong>
            </div>

            <div class="detail-item">
                <span>Amount Due</span>
                <strong>${money(order.due)}</strong>
            </div>

        </div>


        ${
            order.notes
            ?
            `
            <div class="detail-item" style="margin-top:15px;">
                <span>Notes</span>
                <strong>${escapeHTML(order.notes)}</strong>
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


/* =========================
   STATUS
========================= */

function changeStatus(orderID) {

    const order =
        orders.find(item =>
            item.id === orderID
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
        statuses.indexOf(order.status);


    const nextIndex =
        (currentIndex + 1) % statuses.length;


    order.status =
        statuses[nextIndex];


    saveOrders();

    updateDashboard();

    renderOrders();
}


/* =========================
   DELETE
========================= */

function deleteOrder(orderID) {

    const order =
        orders.find(item =>
            item.id === orderID
        );


    if (!order) {
        return;
    }


    const confirmDelete =
        confirm(
            `Delete order ${order.id}?`
        );


    if (!confirmDelete) {
        return;
    }


    orders =
        orders.filter(item =>
            item.id !== orderID
        );


    saveOrders();

    updateDashboard();

    renderOrders();
}


/* =========================
   CUSTOMERS
========================= */

function renderCustomers() {

    const container =
        document.getElementById("customerList");


    const customerMap = {};


    orders.forEach(order => {

        const key =
            order.phone || order.customer;


        if (!customerMap[key]) {

            customerMap[key] = {

                name: order.customer,

                phone: order.phone,

                orders: 0,

                total: 0,

                due: 0

            };

        }


        customerMap[key].orders++;

        customerMap[key].total +=
            Number(order.total || 0);

        customerMap[key].due +=
            Number(order.due || 0);

    });


    const customers =
        Object.values(customerMap);


    if (customers.length === 0) {

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
                    ${escapeHTML(customer.name)}
                </h3>

                <p>
                    📱 ${escapeHTML(customer.phone || "-")}
                </p>

                <p>
                    📦 Orders: ${customer.orders}
                </p>

                <p>
                    💰 Total: ${money(customer.total)}
                </p>

                <p>
                    🔴 Due: ${money(customer.due)}
                </p>

            </div>

        `).join("");
}


/* =========================
   INVOICE
========================= */

function openInvoice(orderID) {

    const order =
        orders.find(item =>
            item.id === orderID
        );


    if (!order) {
        return;
    }


    currentInvoiceOrder = order;


    const invoice =
        document.getElementById("invoiceContent");


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
                        Invoice: ${escapeHTML(order.id)}
                    </p>

                    <p>
                        Date:
                        ${new Date(order.createdAt)
                            .toLocaleDateString("en-IN")}
                    </p>

                </div>

            </div>


            <div class="invoice-customer">

                <div>

                    <h4>BILL TO</h4>

                    <p>
                        <strong>
                            ${escapeHTML(order.customer)}
                        </strong>
                        <br>
                        ${escapeHTML(order.phone)}
                    </p>

                </div>


                <div>

                    <h4>ORDER STATUS</h4>

                    <p>
                        ${escapeHTML(order.status)}
                    </p>

                    ${
                        order.deliveryDate
                        ?
                        `<p>
                            Delivery:
                            ${formatDate(order.deliveryDate)}
                        </p>`
                        :
                        ""
                    }

                </div>

            </div>


            <table class="invoice-table">

                <thead>

                    <tr>
                        <th>Product</th>
                        <th>Details</th>
                        <th>Qty</th>
                        <th>Amount</th>
                    </tr>

                </thead>


                <tbody>

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(order.product)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(order.size || "-")}
                            <br>
                            ${escapeHTML(order.material || "-")}
                            <br>
                            ${escapeHTML(order.printing || "-")}
                            ${
                                order.finishing
                                ?
                                `<br>${escapeHTML(order.finishing)}`
                                :
                                ""
                            }
                        </td>

                        <td>
                            ${order.quantity}
                        </td>

                        <td>
                            ${money(order.total)}
                        </td>

                    </tr>

                </tbody>

            </table>


            <div class="invoice-summary">

                <div class="summary-row">

                    <span>Total</span>

                    <strong>
                        ${money(order.total)}
                    </strong>

                </div>


                <div class="summary-row">

                    <span>Advance Paid</span>

                    <strong>
                        ${money(order.advance)}
                    </strong>

                </div>


                <div class="summary-row due">

                    <span>Amount Due</span>

                    <strong>
                        ${money(order.due)}
                    </strong>

                </div>


                <div class="summary-row total">

                    <span>Payable</span>

                    <strong>
                        ${money(order.due)}
                    </strong>

                </div>

            </div>


            ${
                order.notes
                ?
                `
                <div style="margin-top:25px;font-size:13px;">
                    <strong>Notes:</strong>
                    ${escapeHTML(order.notes)}
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
        .getElementById("invoiceModal")
        .classList.add("show");
}


function closeInvoice() {

    document
        .getElementById("invoiceModal")
        .classList.remove("show");

    currentInvoiceOrder = null;
}


/* =========================
   PRINT INVOICE
========================= */

function printInvoice() {

    if (!currentInvoiceOrder) {
        return;
    }

    window.print();
}


/* =========================
   WHATSAPP
========================= */

function sendWhatsApp() {

    if (!currentInvoiceOrder) {
        return;
    }


    sendOrderWhatsApp(
        currentInvoiceOrder.id
    );
}


function sendOrderWhatsApp(orderID) {

    const order =
        orders.find(item =>
            item.id === orderID
        );


    if (!order) {
        return;
    }


    let phone =
        String(order.phone || "")
            .replace(/\D/g, "");


    if (phone.length === 10) {
        phone = "91" + phone;
    }


    const message =

`Hello ${order.customer},

Your printing order has been received.

Order ID: ${order.id}
Product: ${order.product}
Quantity: ${order.quantity}
Status: ${order.status}

Total Amount: ${money(order.total)}
Advance Paid: ${money(order.advance)}
Amount Due: ${money(order.due)}

${
    order.deliveryDate
    ? "Delivery Date: " + formatDate(order.deliveryDate)
    : ""
}

Thank you for your business.`;


    const url =
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(message);


    window.open(
        url,
        "_blank"
    );
}


/* =========================
   CLOSE MODAL ON BACKGROUND
========================= */

window.addEventListener(
    "click",
    function(event) {

        const orderModal =
            document.getElementById("orderModal");

        const invoiceModal =
            document.getElementById("invoiceModal");


        if (event.target === orderModal) {
            closeModal();
        }


        if (event.target === invoiceModal) {
            closeInvoice();
        }

    }
);


/* =========================
   START APP
========================= */

updateDashboard();

updateDuePreview();