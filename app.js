
const SUPABASE_URL = "https://nmdtgvybajzbdvvufvip.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_I4iqYfmDKTxBWNxuHM4wBg_5wG6yXlJ";

const supabaseClient =
    window.supabase &&
    SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" &&
    SUPABASE_PUBLISHABLE_KEY !== "YOUR_SUPABASE_PUBLISHABLE_KEY"
        ? window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        )
        : null;

const SUPABASE_TABLE = "orders";

let supabaseConnected = false;


const STORAGE_KEY = "printing_business_orders";
const PRODUCT_KEY = "printflow_products_v2";
const SETTINGS_KEY = "printflow_settings_v2";

let orders = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
) || [];


const defaultProducts = [
    ["Visiting Card",300],
    ["Banner",500],
    ["Pamphlet",300],
    ["Flyer",300],
    ["Brochure",800],
    ["Sticker",250],
    ["Poster",300],
    ["Letterhead",400],
    ["Flex",450],
    ["Invitation Card",700],
    ["Packaging",1000],
    ["Other",0]
];


let products =
    JSON.parse(
        localStorage.getItem(PRODUCT_KEY) || "null"
    ) ||
    defaultProducts.map(([name,price])=>({
        name,
        price
    }));


let settings =
    JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "null"
    ) ||
    {
        businessName:"PrintFlow Printing Business",
        businessPhone:"",
        businessWhatsApp:"",
        businessEmail:"",
        businessAddress:""
    };


/* =========================================
   STORAGE
========================================= */

function saveOrders(){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(orders)
    );

}

function orderToSupabase(order){

    return {
        id: order.id,

        customer: order.customer || "",
        phone: order.phone || "",
        email: order.email || "",

        product: order.product || "",
        quantity: Number(order.quantity || 0),

        size: order.size || "",
        material: order.material || "",
        printing: order.printing || "",
        finishing: order.finishing || "",

        delivery_date:
            order.deliveryDate || null,

        total: Number(order.total || 0),
        advance: Number(order.advance || 0),
        due: Number(order.due || 0),

        status: order.status || "New",

        payment_method:
            order.paymentMethod || "Cash",

        notes: order.notes || "",

        payments:
            Array.isArray(order.payments)
                ? order.payments
                : [],

        created_at:
            order.createdAt ||
            new Date().toISOString(),

        updated_at:
            new Date().toISOString()
    };

}


function supabaseToOrder(row){

    return normalizeOrder({

        id: row.id,

        customer: row.customer || "",
        phone: row.phone || "",
        email: row.email || "",

        product: row.product || "",
        quantity: Number(row.quantity || 0),

        size: row.size || "",
        material: row.material || "",
        printing: row.printing || "",
        finishing: row.finishing || "",

        deliveryDate:
            row.delivery_date || "",

        total: Number(row.total || 0),
        advance: Number(row.advance || 0),
        due: Number(row.due || 0),

        status:
            row.status || "New",

        paymentMethod:
            row.payment_method || "Cash",

        notes:
            row.notes || "",

        payments:
            Array.isArray(row.payments)
                ? row.payments
                : [],

        createdAt:
            row.created_at ||
            new Date().toISOString()

    });

}


/* =========================================
   SAVE ONE ORDER TO SUPABASE
========================================= */

async function saveOrderToSupabase(order){

    if(!supabaseClient)
        return false;

    try{

        const row =
            orderToSupabase(order);

        const { error } =
            await supabaseClient
                .from(SUPABASE_TABLE)
                .upsert(
                    row,
                    {
                        onConflict:"id"
                    }
                );

        if(error)
            throw error;

        return true;

    }
    catch(error){

        console.error(
            "Supabase save error:",
            error
        );

        return false;

    }

}


/* =========================================
   DELETE ONE ORDER
========================================= */

async function deleteOrderFromSupabase(orderID){

    if(!supabaseClient)
        return false;

    try{

        const { error } =
            await supabaseClient
                .from(SUPABASE_TABLE)
                .delete()
                .eq("id", orderID);

        if(error)
            throw error;

        return true;

    }
    catch(error){

        console.error(
            "Supabase delete error:",
            error
        );

        return false;

    }

}


/* =========================================
   LOAD ORDERS FROM SUPABASE
========================================= */

async function loadOrdersFromSupabase(){

    if(!supabaseClient){

        console.warn(
            "Supabase is not configured."
        );

        return;

    }

    try{

        const { data, error } =
            await supabaseClient
                .from(SUPABASE_TABLE)
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending:false
                    }
                );

        if(error)
            throw error;


        if(Array.isArray(data)){

            orders =
                data.map(
                    supabaseToOrder
                );

            saveOrders();

            updateDashboard();
            displayOrders();
            displayCustomers();
            displayReports();

        }

        supabaseConnected = true;

        console.log(
            "Supabase connected. Orders loaded:",
            orders.length
        );

    }
    catch(error){

        supabaseConnected = false;

        console.error(
            "Supabase load error:",
            error
        );

        console.warn(
            "Using LocalStorage data."
        );

    }

}


function saveProducts(){

    localStorage.setItem(
        PRODUCT_KEY,
        JSON.stringify(products)
    );

}


function saveSettingsData(){

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );

}


/* =========================================
   HELPERS
========================================= */

function money(amount){

    return "₹" +
        Number(amount || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits:2
            }
        );

}


function escapeHTML(text){

    return String(text ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


function dateLabel(value){

    if(!value)
        return "Not set";

    const d =
        new Date(
            value + "T00:00:00"
        );

    return d.toLocaleDateString(
        "en-IN",
        {
            day:"2-digit",
            month:"short",
            year:"numeric"
        }
    );

}


function todayISO(){

    return new Date()
        .toISOString()
        .slice(0,10);

}


/* =========================================
   NORMALIZE OLD ORDERS
========================================= */

function normalizeOrder(order){

    return {

        ...order,

        email:order.email || "",

        paymentMethod:
            order.paymentMethod || "Cash",

        payments:
            Array.isArray(order.payments)
                ? order.payments
                : [],

        total:
            Number(order.total || 0),

        advance:
            Number(order.advance || 0),

        due:
            Number(
                order.due ??
                (
                    Number(order.total || 0) -
                    Number(order.advance || 0)
                )
            )

    };

}


orders =
    orders.map(normalizeOrder);


/* =========================================
   PAGE NAVIGATION
========================================= */

const titles = {

    dashboard:"Dashboard",
    newOrder:"New Order",
    orders:"All Orders",
    customers:"Customers",
    products:"Products & Pricing",
    reports:"Reports",
    settings:"Settings & Backup"

};


function showPage(pageName){

    document
        .querySelectorAll(".page")
        .forEach(page=>{
            page.classList.remove("active");
        });


    const page =
        document.getElementById(pageName);


    if(page)
        page.classList.add("active");


    document
        .querySelectorAll(".nav-btn")
        .forEach(button=>{
            button.classList.remove("active");
        });


    document
        .querySelectorAll(".nav-btn")
        .forEach(button=>{

            if(
                button.getAttribute("onclick") ===
                `showPage('${pageName}')`
            ){

                button.classList.add("active");

            }

        });


    document.getElementById("pageTitle")
        .innerText =
        titles[pageName] || "Dashboard";


    if(pageName==="dashboard")
        updateDashboard();

    if(pageName==="orders")
        displayOrders();

    if(pageName==="customers")
        displayCustomers();

    if(pageName==="products")
        displayProducts();

    if(pageName==="reports")
        displayReports();

    if(pageName==="settings")
        loadSettings();


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


/* =========================================
   CREATE / EDIT ORDER
========================================= */

document
    .getElementById("orderForm")
    .addEventListener(
        "submit",
        function(event){

            event.preventDefault();


            const id =
                document.getElementById(
                    "editingOrderId"
                ).value;


            const customer =
                document.getElementById(
                    "customerName"
                ).value.trim();


            const phone =
                document.getElementById(
                    "customerPhone"
                ).value.trim();


            const total =
                Number(
                    document.getElementById(
                        "totalAmount"
                    ).value || 0
                );


            const received =
                Number(
                    document.getElementById(
                        "advanceAmount"
                    ).value || 0
                );


            if(
                !customer ||
                !phone ||
                total < 0 ||
                received < 0
            ){

                alert(
                    "Please enter valid customer and billing details."
                );

                return;

            }


            if(received > total){

                alert(
                    "Advance / received amount total amount se zyada nahi ho sakta."
                );

                return;

            }


            const common = {

                customer,

                phone,

                email:
                    document.getElementById(
                        "customerEmail"
                    ).value.trim(),

                product:
                    document.getElementById(
                        "product"
                    ).value,

                quantity:
                    Number(
                        document.getElementById(
                            "quantity"
                        ).value || 0
                    ),

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

                deliveryDate:
                    document.getElementById(
                        "deliveryDate"
                    ).value,

                total,

                advance:received,

                due:
                    Math.max(
                        0,
                        total - received
                    ),

                status:
                    document.getElementById(
                        "orderStatus"
                    ).value,

                paymentMethod:
                    document.getElementById(
                        "paymentMethod"
                    ).value,

                notes:
                    document.getElementById(
                        "notes"
                    ).value.trim()

            };


            /* EDIT */

            if(id){

                const index =
                    orders.findIndex(
                        o=>o.id===id
                    );


                if(index===-1)
                    return;


                const oldOrder =
                    orders[index];


                const oldReceived =
                    Number(
                        oldOrder.advance || 0
                    );


                const updatedOrder = {

                    ...oldOrder,

                    ...common

                };


                updatedOrder.payments =
                    Array.isArray(
                        oldOrder.payments
                    )
                    ? oldOrder.payments
                    : [];


                if(
                    received !==
                    oldReceived
                ){

                    updatedOrder.payments.push({

                        amount:
                            received -
                            oldReceived,

                        method:
                            common.paymentMethod,

                        date:
                            new Date().toISOString(),

                        note:
                            "Payment adjustment"

                    });

                }

       orders[index] = updatedOrder;

saveOrders();

const cloudSaved =
    await saveOrderToSupabase(updatedOrder);

if(cloudSaved){

    alert(
        "Order updated successfully.\n\n" +
        "✓ LocalStorage updated\n" +
        "✓ Supabase updated"
    );

}
else{

    alert(
        "Order updated locally, " +
        "but Supabase update failed."
    );

}


            /* NEW ORDER */

            else {

                const orderID =
                    "ORD-" +
                    Date.now()
                        .toString()
                        .slice(-6);


                const newOrder = {

                    id:orderID,

                    ...common,

                    createdAt:
                        new Date().toISOString(),

                    payments:
                        received > 0
                        ?
                        [
                            {
                                amount:received,

                                method:
                                    common.paymentMethod,

                                date:
                                    new Date().toISOString(),

                                note:
                                    "Initial payment"
                            }
                        ]
                        :
                        []

                };

orders.unshift(newOrder);

saveOrders();

const cloudSaved =
    await saveOrderToSupabase(newOrder);

if(cloudSaved){

    alert(
        "Order successfully created!\n\n" +
        "Order ID: " +
        orderID +
        "\n\n✓ Saved on this computer\n✓ Saved to Supabase"
    );

}
else{

    alert(
        "Order saved locally.\n\n" +
        "Supabase save failed.\n" +
        "Please check your Supabase configuration."
    );

}

/* =========================================
   PAYMENT PREVIEW
========================================= */

[
    "totalAmount",
    "advanceAmount"
].forEach(id=>{

    document
        .getElementById(id)
        .addEventListener(
            "input",
            updatePaymentPreview
        );

});


function updatePaymentPreview(){

    const total =
        Number(
            document.getElementById(
                "totalAmount"
            ).value || 0
        );


    const received =
        Number(
            document.getElementById(
                "advanceAmount"
            ).value || 0
        );


    document.getElementById(
        "previewTotal"
    ).innerText =
        money(total);


    document.getElementById(
        "previewReceived"
    ).innerText =
        money(received);


    document.getElementById(
        "previewDue"
    ).innerText =
        money(
            Math.max(
                0,
                total - received
            )
        );

}


/* =========================================
   RESET ORDER FORM
========================================= */

function resetOrderForm(){

    document
        .getElementById(
            "orderForm"
        )
        .reset();


    document.getElementById(
        "editingOrderId"
    ).value = "";


    document.getElementById(
        "advanceAmount"
    ).value = 0;


    document.getElementById(
        "orderFormTitle"
    ).innerText =
        "Create New Order";


    document.getElementById(
        "saveOrderBtn"
    ).innerText =
        "Save Order";


    document.getElementById(
        "editingBadge"
    ).classList.add(
        "hidden"
    );


    updatePaymentPreview();

}


function cancelEdit(){

    resetOrderForm();

    showPage("dashboard");

}


/* =========================================
   DASHBOARD
========================================= */

function updateDashboard(){

    const totalSales =
        orders.reduce(
            (sum,order)=>
                sum + Number(
                    order.total || 0
                ),
            0
        );


    const totalReceived =
        orders.reduce(
            (sum,order)=>
                sum + Number(
                    order.advance || 0
                ),
            0
        );


    const totalDue =
        orders.reduce(
            (sum,order)=>
                sum + Number(
                    order.due || 0
                ),
            0
        );


    document.getElementById(
        "totalOrders"
    ).innerText =
        orders.length;


    document.getElementById(
        "pendingOrders"
    ).innerText =
        orders.filter(
            o=>o.status!=="Delivered"
        ).length;


    document.getElementById(
        "readyOrders"
    ).innerText =
        orders.filter(
            o=>o.status==="Ready"
        ).length;


    document.getElementById(
        "totalSales"
    ).innerText =
        money(totalSales);


    document.getElementById(
        "totalReceived"
    ).innerText =
        money(totalReceived);


    document.getElementById(
        "totalDue"
    ).innerText =
        money(totalDue);


    displayRecentOrders();

    displayUpcomingDeliveries();

}


/* =========================================
   RECENT ORDERS
========================================= */

function displayRecentOrders(){

    const container =
        document.getElementById(
            "recentOrders"
        );


    const recent =
        orders.slice(0,5);


    container.className =
        recent.length
        ? ""
        : "empty";


    container.innerHTML =
        recent.length
        ?
        recent.map(
            createOrderHTML
        ).join("")
        :
        "No orders yet.";


    addViewButtons();

}


/* =========================================
   UPCOMING DELIVERIES
========================================= */

function displayUpcomingDeliveries(){

    const container =
        document.getElementById(
            "upcomingDeliveries"
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const list =
        orders
        .filter(
            o =>
                o.deliveryDate &&
                o.status !== "Delivered"
        )
        .map(
            o=>({
                ...o,
                d:
                    new Date(
                        o.deliveryDate +
                        "T00:00:00"
                    )
            })
        )
        .filter(
            o=>o.d>=today
        )
        .sort(
            (a,b)=>
                a.d-b.d
        )
        .slice(0,5);


    if(!list.length){

        container.className =
            "empty";

        container.innerHTML =
            "No upcoming deliveries.";

        return;

    }


    container.className = "";


    container.innerHTML =
        list.map(
            order=>`

            <div class="report-row">

                <span>

                    <strong>
                        ${escapeHTML(order.id)}
                    </strong>

                    <br>

                    ${escapeHTML(order.customer)}
                    ·
                    ${escapeHTML(order.product)}

                </span>

                <strong>
                    ${dateLabel(
                        order.deliveryDate
                    )}
                </strong>

            </div>

            `
        ).join("");

}


/* =========================================
   ORDERS
========================================= */

function displayOrders(){

    const container =
        document.getElementById(
            "ordersList"
        );


    const search =
        (
            document.getElementById(
                "searchOrder"
            ).value || ""
        ).toLowerCase();


    const status =
        document.getElementById(
            "filterStatus"
        ).value;


    const payment =
        document.getElementById(
            "filterPayment"
        ).value;


    const filtered =
        orders.filter(order=>{

            const text =
                [
                    order.id,
                    order.customer,
                    order.phone,
                    order.product
                ]
                .join(" ")
                .toLowerCase();


            return (

                text.includes(search)

                &&

                (!status ||
                    order.status === status)

                &&

                (
                    !payment ||

                    (
                        payment === "due"
                        ?
                        Number(order.due) > 0
                        :
                        Number(order.due) <= 0
                    )
                )

            );

        });


    container.innerHTML =
        filtered.length

        ?

        filtered
            .map(createOrderHTML)
            .join("")

        :

        `
        <div class="empty">
            No orders found.
        </div>
        `;


    addViewButtons();

}


/* =========================================
   ORDER HTML
========================================= */

function createOrderHTML(order){

    let badgeClass = "";


    if(order.status==="Ready")
        badgeClass = "ready";


    if(order.status==="Printing")
        badgeClass = "printing";


    if(order.status==="Delivered")
        badgeClass = "delivered";


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
                ${order.quantity || 0}
                pcs
                ·
                ${escapeHTML(order.size || "")}
            </small>

        </div>


        <div>

            <span class="badge ${badgeClass}">
                ${escapeHTML(order.status)}
            </span>

            <br>

            <small>
                ${dateLabel(
                    order.deliveryDate
                )}
            </small>

        </div>


        <div class="amount">

            <strong>
                ${money(order.total)}
            </strong>

            <small>

                ${
                    Number(order.due)>0
                    ?
                    money(order.due)+" due"
                    :
                    "Paid"
                }

            </small>

        </div>


        <button
            class="order-view-btn"
            data-id="${escapeHTML(order.id)}">

            View

        </button>

    </div>

    `;

}


function addViewButtons(){

    document
        .querySelectorAll(
            ".order-view-btn"
        )
        .forEach(button=>{

            button.addEventListener(
                "click",
                ()=>{
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

function openOrder(orderID){

    const order =
        orders.find(
            x=>x.id===orderID
        );


    if(!order)
        return;


    const details =
        document.getElementById(
            "orderDetails"
        );


    details.innerHTML = `

        <p style="color:#2563eb;font-weight:bold">

            ${escapeHTML(order.id)}

        </p>


        <h2>
            ${escapeHTML(order.customer)}
        </h2>


        <p style="color:#737983;margin-top:5px">

            ${escapeHTML(order.phone)}

            ${
                order.email
                ?
                " · "+escapeHTML(order.email)
                :
                ""
            }

        </p>


        <div class="detail-grid">

            ${detailItem(
                "Product",
                order.product
            )}

            ${detailItem(
                "Quantity",
                (order.quantity || 0)+" pcs"
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
                dateLabel(
                    order.deliveryDate
                )
            )}

            ${detailItem(
                "Total",
                money(order.total)
            )}

            ${detailItem(
                "Received",
                money(order.advance)
            )}

            ${detailItem(
                "Due",
                money(order.due)
            )}

            ${detailItem(
                "Payment Method",
                order.paymentMethod
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

                    ${
                        [
                            "New",
                            "Designing",
                            "Customer Approval",
                            "Printing",
                            "Quality Check",
                            "Ready",
                            "Delivered"
                        ]
                        .map(
                            status=>`

                            <option
                                ${
                                    order.status===status
                                    ?
                                    "selected"
                                    :
                                    ""
                                }>

                                ${status}

                            </option>

                            `
                        )
                        .join("")
                    }

                </select>

            </label>


            <button
                class="save-btn"
                onclick="updateOrderStatus('${escapeHTML(order.id)}')">

                Update

            </button>

        </div>


        <div class="modal-actions">

            <button
                class="secondary-btn"
                onclick="editOrder('${escapeHTML(order.id)}')">

                ✏ Edit Order

            </button>


            <button
                class="secondary-btn"
                onclick="printInvoice('${escapeHTML(order.id)}')">

                🧾 Print Invoice

            </button>


            <button
                class="secondary-btn"
                onclick="sendWhatsApp('${escapeHTML(order.id)}')">

                💬 WhatsApp

            </button>


            <button
                class="delete-btn"
                onclick="deleteOrder('${escapeHTML(order.id)}')">

                Delete

            </button>

        </div>

    `;


    document
        .getElementById(
            "orderModal"
        )
        .classList.add("show");

}


function detailItem(
    title,
    value
){

    return `

        <div class="detail-item">

            <span>
                ${escapeHTML(title)}
            </span>

            <strong>
                ${escapeHTML(value || "—")}
            </strong>

        </div>

    `;

}


/* =========================================
   STATUS
========================================= */
function updateOrderStatus(orderID){

    const order =
        orders.find(
            function(item){
                return item.id === orderID;
            }
        );

    if(!order)
        return;


    const statusElement =
        document.getElementById(
            "modalStatus"
        );

    if(!statusElement)
        return;


    const newStatus =
        statusElement.value;


    order.status =
        newStatus;


    /*
       IMPORTANT:
       Delivered ka matlab payment received
       nahi hota.

       Due actual received amount ke
       according calculate hoga.
    */

    order.advance =
        Number(order.advance || 0);


    order.total =
        Number(order.total || 0);


    order.due =
        Math.max(
            0,
            order.total -
            order.advance
        );


    order.updatedAt =
        new Date().toISOString();


    saveOrders();


    saveOrderToSupabase(order)
        .then(function(success){

            if(!success){

                console.error(
                    "Status update saved locally, " +
                    "but Supabase update failed."
                );

            }

        });


    closeModal();

    updateDashboard();

    displayOrders();

    displayCustomers();

    displayReports();

}
/* =========================================
   EDIT ORDER
========================================= */

function editOrder(orderID){

    const order =
        orders.find(
            x=>x.id===orderID
        );


    if(!order)
        return;


    closeModal();

    showPage("newOrder");


    document.getElementById(
        "editingOrderId"
    ).value =
        order.id;


    document.getElementById(
        "customerName"
    ).value =
        order.customer || "";


    document.getElementById(
        "customerPhone"
    ).value =
        order.phone || "";


    document.getElementById(
        "customerEmail"
    ).value =
        order.email || "";


    document.getElementById(
        "product"
    ).value =
        order.product || "";


    document.getElementById(
        "quantity"
    ).value =
        order.quantity || "";


    document.getElementById(
        "size"
    ).value =
        order.size || "";


    document.getElementById(
        "material"
    ).value =
        order.material || "";


    document.getElementById(
        "printing"
    ).value =
        order.printing ||
        "Single Side";


    document.getElementById(
        "finishing"
    ).value =
        order.finishing || "";


    document.getElementById(
        "deliveryDate"
    ).value =
        order.deliveryDate || "";


    document.getElementById(
        "orderStatus"
    ).value =
        order.status || "New";


    document.getElementById(
        "totalAmount"
    ).value =
        order.total || 0;


    document.getElementById(
        "advanceAmount"
    ).value =
        order.advance || 0;


    document.getElementById(
        "paymentMethod"
    ).value =
        order.paymentMethod ||
        "Cash";


    document.getElementById(
        "notes"
    ).value =
        order.notes || "";


    document.getElementById(
        "orderFormTitle"
    ).innerText =
        "Edit Order " +
        order.id;


    document.getElementById(
        "saveOrderBtn"
    ).innerText =
        "Update Order";


    document.getElementById(
        "editingBadge"
    ).classList.remove(
        "hidden"
    );


    updatePaymentPreview();

}


/* =========================================
   CUSTOMERS
========================================= */

function displayCustomers(){

    const container =
        document.getElementById(
            "customerList"
        );


    const search =
        (
            document.getElementById(
                "searchCustomer"
            ).value || ""
        ).toLowerCase();


    const map =
        new Map();


    orders.forEach(order=>{

        const key =
            order.phone ||
            order.customer;


        if(!map.has(key)){

            map.set(
                key,
                {
                    name:order.customer,
                    phone:order.phone,
                    email:order.email || "",
                    orders:0,
                    total:0,
                    due:0
                }
            );

        }


        const customer =
            map.get(key);


        customer.orders++;

        customer.total +=
            Number(
                order.total || 0
            );

        customer.due +=
            Number(
                order.due || 0
            );

    });


    const customers =
        Array
            .from(map.values())
            .filter(
                customer=>
                    (
                        customer.name +
                        " " +
                        customer.phone
                    )
                    .toLowerCase()
                    .includes(search)
            );


    if(!customers.length){

        container.className="";

        container.innerHTML=`

            <div class="empty">
                No customers found.
            </div>

        `;

        return;

    }


    container.className =
        "customer-grid";


    container.innerHTML =
        customers.map(
            customer=>`

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

                    ${
                        customer.email
                        ?
                        " · "+
                        escapeHTML(
                            customer.email
                        )
                        :
                        ""
                    }

                </span>


                <div class="customer-actions">

                    <span class="mini-btn">

                        ${customer.orders}
                        orders

                    </span>


                    <span class="mini-btn">

                        Sales
                        ${money(
                            customer.total
                        )}

                    </span>


                    <span class="mini-btn">

                        Due
                        ${money(
                            customer.due
                        )}

                    </span>

                </div>


                <div class="customer-actions">

                    <button
                        class="mini-btn whatsapp"
                        onclick="sendCustomerWhatsApp(
                            '${escapeHTML(customer.phone)}',
                            '${escapeHTML(customer.name)}'
                        )">

                        💬 WhatsApp

                    </button>

                </div>

            </div>

            `
        )
        .join("");

}


/* =========================================
   PRODUCTS
========================================= */

function displayProducts(){

    const container =
        document.getElementById(
            "productList"
        );


    container.innerHTML = `

        <table class="product-table">

            <thead>

                <tr>

                    <th>
                        Product
                    </th>

                    <th>
                        Starting Price ₹
                    </th>

                    <th>
                    </th>

                </tr>

            </thead>


            <tbody>

                ${
                    products
                    .map(
                        (product,index)=>`

                        <tr>

                            <td>

                                <input
                                    class="product-price"
                                    style="width:100%"
                                    value="${escapeHTML(
                                        product.name
                                    )}"
                                    onchange="updateProduct(
                                        ${index},
                                        'name',
                                        this.value
                                    )"
                                >

                            </td>


                            <td>

                                <input
                                    class="product-price"
                                    type="number"
                                    value="${Number(
                                        product.price || 0
                                    )}"
                                    onchange="updateProduct(
                                        ${index},
                                        'price',
                                        this.value
                                    )"
                                >

                            </td>


                            <td>

                                <button
                                    class="delete-btn"
                                    onclick="deleteProduct(${index})">

                                    Delete

                                </button>

                            </td>

                        </tr>

                        `
                    )
                    .join("")
                }

            </tbody>

        </table>

    `;

}


function addProduct(){

    const name =
        prompt(
            "Product name?"
        );


    if(!name)
        return;


    products.push({
        name:name.trim(),
        price:0
    });


    saveProducts();

    displayProducts();

    syncProductOptions();

}


function updateProduct(
    index,
    key,
    value
){

    products[index][key] =
        key==="price"
        ?
        Number(value || 0)
        :
        value.trim();


    saveProducts();

    syncProductOptions();

}


function deleteProduct(index){

    if(
        !confirm(
            "Delete this product?"
        )
    )
        return;


    products.splice(
        index,
        1
    );


    saveProducts();

    displayProducts();

    syncProductOptions();

}


function syncProductOptions(){

    const select =
        document.getElementById(
            "product"
        );


    const current =
        select.value;


    select.innerHTML =

        '<option value="">Select Product</option>' +

        products
            .map(
                product=>
                    `<option>${escapeHTML(
                        product.name
                    )}</option>`
            )
            .join("");


    select.value =
        current;

}


/* =========================================
   REPORTS
========================================= */

function displayReports(){

    const now =
        new Date();


    const month =
        now.getMonth();


    const year =
        now.getFullYear();


    const monthlyOrders =
        orders.filter(order=>{

            const date =
                new Date(
                    order.createdAt || 0
                );


            return(
                date.getMonth()===month &&
                date.getFullYear()===year
            );

        });


    const sales =
        monthlyOrders.reduce(
            (sum,order)=>
                sum+
                Number(
                    order.total || 0
                ),
            0
        );


    const received =
        monthlyOrders.reduce(
            (sum,order)=>
                sum+
                Number(
                    order.advance || 0
                ),
            0
        );


    const due =
        monthlyOrders.reduce(
            (sum,order)=>
                sum+
                Number(
                    order.due || 0
                ),
            0
        );


    document.getElementById(
        "monthSales"
    ).innerText =
        money(sales);


    document.getElementById(
        "monthReceived"
    ).innerText =
        money(received);


    document.getElementById(
        "monthDue"
    ).innerText =
        money(due);


    document.getElementById(
        "monthOrders"
    ).innerText =
        monthlyOrders.length;


    const productMap={};


    orders.forEach(order=>{

        productMap[order.product] =
            (
                productMap[order.product] ||
                0
            ) + 1;

    });


    document.getElementById(
        "productReport"
    ).innerHTML =

        Object.keys(productMap).length

        ?

        Object.entries(
            productMap
        )
        .sort(
            (a,b)=>b[1]-a[1]
        )
        .map(
            ([name,count])=>`

            <div class="report-row">

                <span>
                    ${escapeHTML(name)}
                </span>

                <strong>
                    ${count} orders
                </strong>

            </div>

            `
        )
        .join("")

        :

        `
        <div class="empty">
            No data.
        </div>
        `;


    const statusMap={};


    orders.forEach(order=>{

        statusMap[order.status] =
            (
                statusMap[order.status] ||
                0
            ) + 1;

    });


    document.getElementById(
        "statusReport"
    ).innerHTML =

        Object.keys(statusMap).length

        ?

        Object.entries(
            statusMap
        )
        .map(
            ([status,count])=>`

            <div class="report-row">

                <span>
                    ${escapeHTML(status)}
                </span>

                <strong>
                    ${count}
                </strong>

            </div>

            `
        )
        .join("")

        :

        `
        <div class="empty">
            No data.
        </div>
        `;

}


/* =========================================
   SETTINGS
========================================= */

function loadSettings(){

    document.getElementById(
        "businessName"
    ).value =
        settings.businessName || "";


    document.getElementById(
        "businessPhone"
    ).value =
        settings.businessPhone || "";


    document.getElementById(
        "businessWhatsApp"
    ).value =
        settings.businessWhatsApp || "";


    document.getElementById(
        "businessEmail"
    ).value =
        settings.businessEmail || "";


    document.getElementById(
        "businessAddress"
    ).value =
        settings.businessAddress || "";

}


function saveSettings(){

    settings={

        businessName:
            document.getElementById(
                "businessName"
            ).value.trim(),

        businessPhone:
            document.getElementById(
                "businessPhone"
            ).value.trim(),

        businessWhatsApp:
            document.getElementById(
                "businessWhatsApp"
            ).value.trim(),

        businessEmail:
            document.getElementById(
                "businessEmail"
            ).value.trim(),

        businessAddress:
            document.getElementById(
                "businessAddress"
            ).value.trim()

    };


    saveSettingsData();


    alert(
        "Settings saved."
    );

}


/* =========================================
   EXPORT
========================================= */

function exportData(){

    const data={

        version:"2.0",

        exportedAt:
            new Date().toISOString(),

        orders,

        products,

        settings

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:"application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href=url;


    a.download =
        "printflow-backup-" +
        todayISO() +
        ".json";


    a.click();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================
   IMPORT
========================================= */

function importData(event){

    const file =
        event.target.files[0];


    if(!file)
        return;


    const reader =
        new FileReader();


    reader.onload =
        event=>{

            try{

                const data =
                    JSON.parse(
                        event.target.result
                    );


                if(
                    !Array.isArray(
                        data.orders
                    )
                ){

                    throw new Error(
                        "Invalid backup"
                    );

                }


                if(
                    !confirm(
                        "Importing backup will replace current local data. Continue?"
                    )
                )
                    return;


                orders =
                    data.orders.map(
                        normalizeOrder
                    );


                products =
                    Array.isArray(
                        data.products
                    )
                    ?
                    data.products
                    :
                    products;


                settings =
                    data.settings ||
                    settings;


                saveOrders();

                saveProducts();

                saveSettingsData();

                syncProductOptions();

                updateDashboard();


                alert(
                    "Backup imported successfully."
                );

            }

            catch(error){

                alert(
                    "Invalid PrintFlow backup file."
                );

            }

        };


    reader.readAsText(
        file
    );


    event.target.value="";

}


/* =========================================
   CLEAR DATA
========================================= */

function clearAllData(){

    if(
        !confirm(
            "This will delete all PrintFlow orders, products and settings from this browser. Continue?"
        )
    )
        return;


    localStorage.removeItem(
        STORAGE_KEY
    );


    localStorage.removeItem(
        PRODUCT_KEY
    );


    localStorage.removeItem(
        SETTINGS_KEY
    );


    orders=[];


    products =
        defaultProducts.map(
            ([name,price])=>({
                name,
                price
            })
        );


    settings={

        businessName:
            "PrintFlow Printing Business",

        businessPhone:"",

        businessWhatsApp:"",

        businessEmail:"",

        businessAddress:""

    };


    updateDashboard();

    displayOrders();

    displayCustomers();

    displayProducts();

    loadSettings();


    alert(
        "Local data cleared."
    );

}


/* =========================================
   WHATSAPP
========================================= */

function sendWhatsApp(orderID){

    const order =
        orders.find(
            x=>x.id===orderID
        );


    if(!order)
        return;


    const phone =
        (
            order.phone || ""
        ).replace(
            /\D/g,
            ""
        );


    if(!phone){

        alert(
            "Customer mobile number not available."
        );

        return;

    }


    const message =

`Hello ${order.customer},

Order ${order.id} update:

Product: ${order.product}

Status: ${order.status}

Total: ${money(order.total)}

Paid: ${money(order.advance)}

Due: ${money(order.due)}

Delivery: ${dateLabel(order.deliveryDate)}

Thank you.`;


    window.open(
        "https://wa.me/91" +
        phone +
        "?text=" +
        encodeURIComponent(
            message
        ),
        "_blank"
    );

}


function sendCustomerWhatsApp(
    phone,
    name
){

    const number =
        (
            phone || ""
        ).replace(
            /\D/g,
            ""
        );


    if(!number)
        return;


    const message =
        `Hello ${name}, this is ${settings.businessName}. Thank you for choosing us.`;


    window.open(
        "https://wa.me/91" +
        number +
        "?text=" +
        encodeURIComponent(
            message
        ),
        "_blank"
    );

}


/* =========================================
   PRINT INVOICE
========================================= */

function printInvoice(orderID){

    const order =
        orders.find(
            x=>x.id===orderID
        );


    if(!order)
        return;


    const windowObject =
        window.open(
            "",
            "_blank",
            "width=850,height=900"
        );


    if(!windowObject){

        alert(
            "Please allow popups to print the invoice."
        );

        return;

    }


    windowObject.document.write(`

<!DOCTYPE html>

<html>

<head>

<title>
Invoice ${escapeHTML(
    order.id
)}
</title>


<style>

body{
    font-family:Arial;
    padding:35px;
    color:#111;
}

.invoice-head{
    display:flex;
    justify-content:space-between;
    border-bottom:2px solid #111;
    padding-bottom:15px;
}

.muted{
    color:#666;
    font-size:12px;
}

table{
    width:100%;
    border-collapse:collapse;
    margin-top:20px;
}

th,
td{
    border-bottom:1px solid #ddd;
    padding:10px;
    text-align:left;
    font-size:13px;
}

.right{
    text-align:right;
}

.total{
    margin-left:auto;
    width:280px;
    margin-top:15px;
}

.total div{
    display:flex;
    justify-content:space-between;
    padding:6px;
}

.grand{
    font-size:18px;
    font-weight:bold;
    border-top:2px solid #111;
}

button{
    padding:10px 18px;
    margin-top:20px;
}

@media print{

    button{
        display:none;
    }

}

</style>

</head>


<body>


<div class="invoice-head">

<div>

<h1>
${escapeHTML(
    settings.businessName ||
    "PrintFlow"
)}
</h1>

<div class="muted">
${escapeHTML(
    settings.businessAddress || ""
)}
</div>

<div class="muted">

${escapeHTML(
    settings.businessPhone || ""
)}

${
    settings.businessEmail
    ?
    " · " +
    escapeHTML(
        settings.businessEmail
    )
    :
    ""
}

</div>

</div>


<div>

<strong>
INVOICE
</strong>

<br>

<span class="muted">

${escapeHTML(
    order.id
)}

<br>

${dateLabel(
    todayISO()
)}

</span>

</div>

</div>


<h3>
Bill To
</h3>


<div>

${escapeHTML(
    order.customer
)}

<br>

<span class="muted">

${escapeHTML(
    order.phone
)}

${
    order.email
    ?
    " · " +
    escapeHTML(
        order.email
    )
    :
    ""
}

</span>

</div>


<table>

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

<th class="right">
Amount
</th>

</tr>

</thead>


<tbody>

<tr>

<td>
${escapeHTML(
    order.product
)}
</td>


<td>

${escapeHTML(
    [
        order.size,
        order.material,
        order.printing,
        order.finishing
    ]
    .filter(Boolean)
    .join(" · ")
)}

</td>


<td>
${order.quantity}
</td>


<td class="right">
${money(
    order.total
)}
</td>

</tr>

</tbody>

</table>


<div class="total">

<div>

<span>
Total
</span>

<strong>
${money(
    order.total
)}
</strong>

</div>


<div>

<span>
Paid
</span>

<strong>
${money(
    order.advance
)}
</strong>

</div>


<div class="grand">

<span>
Balance Due
</span>

<strong>
${money(
    order.due
)}
</strong>

</div>

</div>


<p
style="margin-top:35px"
class="muted">

Thank you for your business.

</p>


<button
onclick="window.print()">

Print Invoice

</button>


</body>

</html>

`);


    windowObject.document.close();

    windowObject.focus();

}


/* =========================================
   KEYBOARD
========================================= */

document.addEventListener(
    "keydown",
    event=>{

        if(
            event.key==="Escape"
        ){

            closeModal();

        }

    }
);


/* =========================================
   INITIALIZE
========================================= */
syncProductOptions();

updateDashboard();

updatePaymentPreview();

loadOrdersFromSupabase();
async function testSupabase(){

    if(!supabaseClient){

        console.error(
            "Supabase client not configured."
        );

        return;

    }

    const { data, error } =
        await supabaseClient
            .from(SUPABASE_TABLE)
            .select("id")
            .limit(1);

    if(error){

        console.error(
            "SUPABASE ERROR:",
            error
        );

        alert(
            "Supabase connection failed.\n\n" +
            error.message
        );

        return;

    }

    console.log(
        "SUPABASE CONNECTED:",
        data
    );

    alert(
        "✓ Supabase Connected Successfully"
    );
