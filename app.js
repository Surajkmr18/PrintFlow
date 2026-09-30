/* =========================================================
   PRINTFLOW 2.0 - COMPLETE APP.JS
   LocalStorage + Supabase
   ========================================================= */

/* =========================================================
   SUPABASE CONFIG
========================================================= */

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
let isSyncingOrders = false;


/* =========================================================
   LOCAL STORAGE
========================================================= */

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


/* =========================================================
   STORAGE HELPERS
========================================================= */

function saveOrders(){
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(orders)
    );
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


/* =========================================================
   HELPERS
========================================================= */

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

    let d;

    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value))){
        d = new Date(value + "T00:00:00");
    }else{
        d = new Date(value);
    }

    if(Number.isNaN(d.getTime()))
        return "Not set";

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

    const d = new Date();

    const offset =
        d.getTimezoneOffset();

    return new Date(
        d.getTime() - offset * 60000
    )
    .toISOString()
    .slice(0,10);
}


function nowISO(){
    return new Date().toISOString();
}


/* =========================================================
   NORMALIZE ORDER
========================================================= */

function normalizeOrder(order){

    const total =
        Number(order.total || 0);

    const advance =
        Number(order.advance || 0);

    return {
        ...order,

        id: String(order.id || ""),

        customer: order.customer || "",
        phone: order.phone || "",
        email: order.email || "",

        product: order.product || "",
        quantity: Number(order.quantity || 0),

        size: order.size || "",
        material: order.material || "",
        printing: order.printing || "",
        finishing: order.finishing || "",

        deliveryDate: order.deliveryDate || "",

        total,
        advance,

        due:
            Number.isFinite(Number(order.due))
                ? Number(order.due)
                : Math.max(0,total - advance),

        status: order.status || "New",

        paymentMethod:
            order.paymentMethod || "Cash",

        notes: order.notes || "",

        payments:
            Array.isArray(order.payments)
                ? order.payments
                : [],

        createdAt:
            order.createdAt ||
            nowISO(),

        updatedAt:
            order.updatedAt ||
            order.createdAt ||
            nowISO()
    };
}


orders =
    orders
        .map(normalizeOrder)
        .filter(order => order.id);


/* =========================================================
   ORDER -> SUPABASE
========================================================= */

function orderToSupabase(order){

    const normalized =
        normalizeOrder(order);

    return {
        id: normalized.id,

        customer: normalized.customer,
        phone: normalized.phone,
        email: normalized.email,

        product: normalized.product,
        quantity: Number(normalized.quantity || 0),

        size: normalized.size,
        material: normalized.material,
        printing: normalized.printing,
        finishing: normalized.finishing,

        delivery_date:
            normalized.deliveryDate || null,

        total:
            Number(normalized.total || 0),

        advance:
            Number(normalized.advance || 0),

        due:
            Number(normalized.due || 0),

        status:
            normalized.status,

        payment_method:
            normalized.paymentMethod,

        notes:
            normalized.notes,

        payments:
            Array.isArray(normalized.payments)
                ? normalized.payments
                : [],

        created_at:
            normalized.createdAt,

        updated_at:
            normalized.updatedAt
    };
}


/* =========================================================
   SUPABASE -> ORDER
========================================================= */

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

        total:
            Number(row.total || 0),

        advance:
            Number(row.advance || 0),

        due:
            Number(row.due || 0),

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
            nowISO(),

        updatedAt:
            row.updated_at ||
            row.created_at ||
            nowISO()
    });
}


/* =========================================================
   SAVE ONE ORDER TO SUPABASE
========================================================= */

async function saveOrderToSupabase(order){

    if(!supabaseClient){
        console.warn("Supabase client not configured.");
        return false;
    }

    try{

        const normalized =
            normalizeOrder(order);

        const row =
            orderToSupabase(normalized);

        const { error } =
            await supabaseClient
                .from(SUPABASE_TABLE)
                .upsert(
                    row,
                    {
                        onConflict:"id"
                    }
                );

        if(error){
            console.error(
                "Supabase save error:",
                error
            );
            return false;
        }

        supabaseConnected = true;

        return true;

    }catch(error){

        console.error(
            "Supabase save exception:",
            error
        );

        return false;
    }
}


/* =========================================================
   DELETE ONE ORDER FROM SUPABASE
========================================================= */

async function deleteOrderFromSupabase(orderID){

    if(!supabaseClient)
        return false;

    try{

        const { error } =
            await supabaseClient
                .from(SUPABASE_TABLE)
                .delete()
                .eq("id",orderID);

        if(error)
            throw error;

        supabaseConnected = true;

        return true;

    }catch(error){

        console.error(
            "Supabase delete error:",
            error
        );

        return false;
    }
}


/* =========================================================
   LOAD + MERGE SUPABASE ORDERS
   IMPORTANT:
   This does NOT replace LocalStorage blindly.
========================================================= */

async function loadOrdersFromSupabase(){

    if(!supabaseClient){
        console.warn(
            "Supabase is not configured."
        );
        return;
    }

    if(isSyncingOrders)
        return;

    isSyncingOrders = true;

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

        const remoteOrders =
            Array.isArray(data)
                ? data.map(supabaseToOrder)
                : [];


        const localMap =
            new Map(
                orders.map(
                    order => [
                        order.id,
                        normalizeOrder(order)
                    ]
                )
            );


        /*
           Merge remote records.
           If both exist, latest updatedAt wins.
        */

        remoteOrders.forEach(remoteOrder => {

            const localOrder =
                localMap.get(
                    remoteOrder.id
                );

            if(!localOrder){

                localMap.set(
                    remoteOrder.id,
                    remoteOrder
                );

                return;
            }


            const localTime =
                new Date(
                    localOrder.updatedAt ||
                    localOrder.createdAt ||
                    0
                ).getTime();


            const remoteTime =
                new Date(
                    remoteOrder.updatedAt ||
                    remoteOrder.createdAt ||
                    0
                ).getTime();


            if(remoteTime > localTime){

                localMap.set(
                    remoteOrder.id,
                    remoteOrder
                );
            }

        });


        orders =
            Array.from(
                localMap.values()
            )
            .map(normalizeOrder)
            .sort(
                (a,b) =>
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
            );


        saveOrders();


        /*
           Upload local-only orders to Supabase.
        */

        const remoteIDs =
            new Set(
                remoteOrders.map(
                    order => order.id
                )
            );


        for(const order of orders){

            if(!remoteIDs.has(order.id)){

                await saveOrderToSupabase(
                    order
                );
            }
        }


        supabaseConnected = true;


        refreshAllViews();


        console.log(
            "Supabase sync complete:",
            orders.length,
            "orders"
        );

    }catch(error){

        supabaseConnected = false;

        console.error(
            "Supabase load error:",
            error
        );

        console.warn(
            "Using LocalStorage data."
        );

    }finally{

        isSyncingOrders = false;
    }
}


/* =========================================================
   SYNC ALL LOCAL ORDERS
========================================================= */

async function syncAllOrdersToSupabase(){

    if(!supabaseClient)
        return false;

    let success = true;

    for(const order of orders){

        const saved =
            await saveOrderToSupabase(
                order
            );

        if(!saved)
            success = false;
    }

    return success;
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

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

            if(
                button.getAttribute("onclick") ===
                `showPage('${pageName}')`
            ){
                button.classList.add("active");
            }
        });


    const titleEl =
        document.getElementById("pageTitle");

    if(titleEl){
        titleEl.innerText =
            titles[pageName] || "Dashboard";
    }


    if(pageName === "dashboard")
        updateDashboard();

    if(pageName === "orders")
        displayOrders();

    if(pageName === "customers")
        displayCustomers();

    if(pageName === "products")
        displayProducts();

    if(pageName === "reports")
        displayReports();

    if(pageName === "settings")
        loadSettings();


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}


/* =========================================================
   CREATE / EDIT ORDER
========================================================= */

document
    .getElementById("orderForm")
    .addEventListener(
        "submit",
        async function(event){

            event.preventDefault();


            const id =
                document
                    .getElementById("editingOrderId")
                    .value
                    .trim();


            const customer =
                document
                    .getElementById("customerName")
                    .value
                    .trim();


            const phone =
                document
                    .getElementById("customerPhone")
                    .value
                    .trim();


            const total =
                Number(
                    document
                        .getElementById("totalAmount")
                        .value || 0
                );


            const received =
                Number(
                    document
                        .getElementById("advanceAmount")
                        .value || 0
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
                    document
                        .getElementById("customerEmail")
                        .value
                        .trim(),

                product:
                    document
                        .getElementById("product")
                        .value,

                quantity:
                    Number(
                        document
                            .getElementById("quantity")
                            .value || 0
                    ),

                size:
                    document
                        .getElementById("size")
                        .value
                        .trim(),

                material:
                    document
                        .getElementById("material")
                        .value
                        .trim(),

                printing:
                    document
                        .getElementById("printing")
                        .value,

                finishing:
                    document
                        .getElementById("finishing")
                        .value
                        .trim(),

                deliveryDate:
                    document
                        .getElementById("deliveryDate")
                        .value,

                total,

                advance:received,

                due:
                    Math.max(
                        0,
                        total - received
                    ),

                status:
                    document
                        .getElementById("orderStatus")
                        .value,

                paymentMethod:
                    document
                        .getElementById("paymentMethod")
                        .value,

                notes:
                    document
                        .getElementById("notes")
                        .value
                        .trim()
            };


            /* =========================================
               EDIT EXISTING ORDER
            ========================================= */

            if(id){

                const index =
                    orders.findIndex(
                        order => order.id === id
                    );


                if(index === -1){

                    alert("Order not found.");

                    return;
                }


                const oldOrder =
                    normalizeOrder(
                        orders[index]
                    );


                const oldReceived =
                    Number(
                        oldOrder.advance || 0
                    );


                const updatedOrder =
                    normalizeOrder({

                        ...oldOrder,

                        ...common,

                        id:oldOrder.id,

                        createdAt:
                            oldOrder.createdAt,

                        updatedAt:
                            nowISO()
                    });


                updatedOrder.payments =
                    Array.isArray(
                        oldOrder.payments
                    )
                    ? [...oldOrder.payments]
                    : [];


                if(
                    received !== oldReceived
                ){

                    updatedOrder.payments.push({

                        amount:
                            received - oldReceived,

                        method:
                            common.paymentMethod,

                        date:
                            nowISO(),

                        note:
                            "Payment adjustment"
                    });
                }


                orders[index] =
                    updatedOrder;

                saveOrders();

                refreshAllViews();


                const cloudSaved =
                    await saveOrderToSupabase(
                        updatedOrder
                    );


                if(cloudSaved){

                    alert(
                        "Order updated successfully.\n\n" +
                        "✓ LocalStorage updated\n" +
                        "✓ Supabase updated"
                    );

                }else{

                    alert(
                        "Order updated locally.\n\n" +
                        "⚠ Supabase update failed."
                    );
                }


                cancelEdit();

                return;
            }


            /* =========================================
               CREATE NEW ORDER
            ========================================= */

            const orderID =
                "ORD-" +
                Date.now()
                    .toString()
                    .slice(-6);


            const now =
                nowISO();


            const newOrder =
                normalizeOrder({

                    id:orderID,

                    ...common,

                    createdAt:now,

                    updatedAt:now,

                    payments:
                        received > 0
                        ?
                        [
                            {
                                amount:received,
                                method:
                                    common.paymentMethod,
                                date:now,
                                note:
                                    "Initial payment"
                            }
                        ]
                        :
                        []
                });


            /*
               LocalStorage FIRST
            */

            orders.unshift(
                newOrder
            );

            saveOrders();

            refreshAllViews();


            /*
               Supabase SECOND
            */

            const cloudSaved =
                await saveOrderToSupabase(
                    newOrder
                );


            if(cloudSaved){

                alert(
                    "Order successfully created!\n\n" +
                    "Order ID: " +
                    orderID +
                    "\n\n" +
                    "✓ Saved on this computer\n" +
                    "✓ Saved to Supabase"
                );

            }else{

                alert(
                    "Order saved locally.\n\n" +
                    "⚠ Supabase save failed."
                );
            }


            cancelEdit();
        }
    );


/* =========================================================
   PAYMENT PREVIEW
========================================================= */

[
    "totalAmount",
    "advanceAmount"
].forEach(id=>{

    const element =
        document.getElementById(id);

    if(element){

        element.addEventListener(
            "input",
            updatePaymentPreview
        );
    }
});


function updatePaymentPreview(){

    const total =
        Number(
            document
                .getElementById("totalAmount")
                .value || 0
        );


    const received =
        Number(
            document
                .getElementById("advanceAmount")
                .value || 0
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


/* =========================================================
   RESET FORM
========================================================= */

function resetOrderForm(){

    const form =
        document.getElementById(
            "orderForm"
        );

    if(form)
        form.reset();


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


/* =========================================================
   DASHBOARD
========================================================= */

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
            o => o.status !== "Delivered"
        ).length;


    document.getElementById(
        "readyOrders"
    ).innerText =
        orders.filter(
            o => o.status === "Ready"
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


/* =========================================================
   RECENT ORDERS
========================================================= */

function displayRecentOrders(){

    const container =
        document.getElementById(
            "recentOrders"
        );

    if(!container)
        return;


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


/* =========================================================
   UPCOMING DELIVERIES
========================================================= */

function displayUpcomingDeliveries(){

    const container =
        document.getElementById(
            "upcomingDeliveries"
        );

    if(!container)
        return;


    const today =
        new Date();

    today.setHours(
        0,0,0,0
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
                o => o.d >= today
            )
            .sort(
                (a,b) => a.d - b.d
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
                    ${dateLabel(order.deliveryDate)}
                </strong>

            </div>

            `
        ).join("");
}


/* =========================================================
   ORDERS
========================================================= */

function displayOrders(){

    const container =
        document.getElementById(
            "ordersList"
        );

    if(!container)
        return;


    const search =
        (
            document.getElementById(
                "searchOrder"
            )?.value || ""
        )
        .toLowerCase();


    const status =
        document.getElementById(
            "filterStatus"
        )?.value || "";


    const payment =
        document.getElementById(
            "filterPayment"
        )?.value || "";


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


            return(

                text.includes(search)

                &&

                (
                    !status ||
                    order.status === status
                )

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


/* =========================================================
   ORDER HTML
========================================================= */

function createOrderHTML(order){

    let badgeClass = "";


    if(order.status === "Ready")
        badgeClass = "ready";


    if(order.status === "Printing")
        badgeClass = "printing";


    if(order.status === "Delivered")
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
                ${dateLabel(order.deliveryDate)}
            </small>

        </div>


        <div class="amount">

            <strong>
                ${money(order.total)}
            </strong>

            <small>
                ${
                    Number(order.due) > 0
                    ?
                    money(order.due) + " due"
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


/* =========================================================
   ORDER DETAILS / MODAL
========================================================= */

function openOrder(orderID){

    const order =
        orders.find(
            x => x.id === orderID
        );


    if(!order)
        return;


    const details =
        document.getElementById(
            "orderDetails"
        );


    if(!details)
        return;


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
                " · " + escapeHTML(order.email)
                :
                ""
            }

        </p>


        <div class="detail-grid">

            ${detailItem("Product",order.product)}

            ${detailItem(
                "Quantity",
                (order.quantity || 0) + " pcs"
            )}

            ${detailItem("Size",order.size)}

            ${detailItem("Material",order.material)}

            ${detailItem("Printing",order.printing)}

            ${detailItem("Finishing",order.finishing)}

            ${detailItem(
                "Delivery Date",
                dateLabel(order.deliveryDate)
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
            detailItem("Notes",order.notes)
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
                            status => `

                            <option
                                value="${escapeHTML(status)}"
                                ${
                                    order.status === status
                                    ?
                                    "selected"
                                    :
                                    ""
                                }>

                                ${escapeHTML(status)}

                            </option>

                            `
                        )
                        .join("")
                    }

                </select>

            </label>


            <button
                type="button"
                class="save-btn"
                id="updateStatusBtn">

                Update

            </button>

        </div>


        <div class="modal-actions">

            <button
                type="button"
                class="secondary-btn"
                id="editOrderBtn">

                ✏ Edit Order

            </button>


            <button
                type="button"
                class="secondary-btn"
                id="printInvoiceBtn">

                🧾 Print Invoice

            </button>


            <button
                type="button"
                class="secondary-btn"
                id="whatsappOrderBtn">

                💬 WhatsApp

            </button>


            <button
                type="button"
                class="delete-btn"
                id="deleteOrderBtn">

                Delete

            </button>

        </div>

    `;


    /*
       Event listeners are used instead of inline
       onclick strings. This is more reliable.
    */

    document
        .getElementById("updateStatusBtn")
        .addEventListener(
            "click",
            ()=>{
                updateOrderStatus(orderID);
            }
        );


    document
        .getElementById("editOrderBtn")
        .addEventListener(
            "click",
            ()=>{
                editOrder(orderID);
            }
        );


    document
        .getElementById("printInvoiceBtn")
        .addEventListener(
            "click",
            ()=>{
                printInvoice(orderID);
            }
        );


    document
        .getElementById("whatsappOrderBtn")
        .addEventListener(
            "click",
            ()=>{
                sendWhatsApp(orderID);
            }
        );


    document
        .getElementById("deleteOrderBtn")
        .addEventListener(
            "click",
            ()=>{
                deleteOrder(orderID);
            }
        );


    document
        .getElementById("orderModal")
        .classList.add("show");
}


function detailItem(title,value){

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


/* =========================================================
   STATUS UPDATE
   FIXED
========================================================= */

async function updateOrderStatus(orderID){

    const order =
        orders.find(
            o => o.id === orderID
        );


    if(!order){

        alert("Order not found.");

        return;
    }


    const statusEl =
        document.getElementById(
            "modalStatus"
        );


    if(!statusEl){

        alert(
            "Status selector not found."
        );

        return;
    }


    const newStatus =
        statusEl.value;


    if(!newStatus){

        alert(
            "Please select a status."
        );

        return;
    }


    /*
       UPDATE LOCAL OBJECT
    */

    order.status =
        newStatus;


    order.total =
        Number(order.total || 0);


    order.advance =
        Number(order.advance || 0);


    order.due =
        Math.max(
            0,
            order.total - order.advance
        );


    order.updatedAt =
        nowISO();


    /*
       SAVE LOCAL FIRST
    */

    saveOrders();


    /*
       REFRESH UI
    */

    updateDashboard();

    displayOrders();

    displayCustomers();

    displayReports();


    /*
       SAVE TO SUPABASE
    */

    const cloudSaved =
        await saveOrderToSupabase(
            order
        );


    if(cloudSaved){

        alert(
            "Status updated successfully.\n\n" +
            "✓ LocalStorage updated\n" +
            "✓ Supabase updated"
        );

    }else{

        alert(
            "Status updated locally.\n\n" +
            "⚠ Supabase update failed."
        );
    }


    /*
       Re-open modal with latest status
    */

    openOrder(orderID);
}


/* =========================================================
   EDIT ORDER
========================================================= */

function editOrder(orderID){

    const order =
        orders.find(
            x => x.id === orderID
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
        order.paymentMethod || "Cash";


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


/* =========================================================
   DELETE ORDER
========================================================= */

async function deleteOrder(orderID){

    const order =
        orders.find(
            o => o.id === orderID
        );


    if(!order){

        alert("Order not found.");

        return;
    }


    const confirmed =
        confirm(
            `Delete order ${orderID}?\n\nThis action cannot be undone.`
        );


    if(!confirmed)
        return;


    /*
       LOCAL DELETE FIRST
    */

    orders =
        orders.filter(
            o => o.id !== orderID
        );


    saveOrders();


    /*
       REFRESH UI
    */

    updateDashboard();

    displayOrders();

    displayCustomers();

    displayReports();

    closeModal();


    /*
       SUPABASE DELETE
    */

    const cloudDeleted =
        await deleteOrderFromSupabase(
            orderID
        );


    if(cloudDeleted){

        alert(
            "Order deleted successfully.\n\n" +
            "✓ Deleted locally\n" +
            "✓ Deleted from Supabase"
        );

    }else{

        alert(
            "Order deleted locally.\n\n" +
            "⚠ Supabase delete failed."
        );
    }
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal(){

    const modal =
        document.getElementById(
            "orderModal"
        );

    if(modal)
        modal.classList.remove("show");
}


/* =========================================================
   CUSTOMERS
========================================================= */

function displayCustomers(){

    const container =
        document.getElementById(
            "customerList"
        );

    if(!container)
        return;


    const search =
        (
            document.getElementById(
                "searchCustomer"
            )?.value || ""
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
            Number(order.total || 0);

        customer.due +=
            Number(order.due || 0);
    });


    const customers =
        Array
            .from(map.values())
            .filter(
                customer =>
                    (
                        customer.name +
                        " " +
                        customer.phone
                    )
                    .toLowerCase()
                    .includes(search)
            );


    if(!customers.length){

        container.className = "";

        container.innerHTML = `

            <div class="empty">
                No customers found.
            </div>

        `;

        return;
    }


    container.className =
        "customer-grid";


    container.innerHTML =
        customers
            .map(
                customer=>`

                <div class="customer-card">

                    <strong>
                        ${escapeHTML(customer.name)}
                    </strong>

                    <span>

                        ${escapeHTML(customer.phone)}

                        ${
                            customer.email
                            ?
                            " · " +
                            escapeHTML(customer.email)
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
                            ${money(customer.total)}

                        </span>


                        <span class="mini-btn">

                            Due
                            ${money(customer.due)}

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


/* =========================================================
   PRODUCTS
========================================================= */

function displayProducts(){

    const container =
        document.getElementById(
            "productList"
        );

    if(!container)
        return;


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

                    <th></th>

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
                                        value="${escapeHTML(product.name)}"
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
                                        value="${Number(product.price || 0)}"
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
        prompt("Product name?");


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

    if(!products[index])
        return;


    products[index][key] =
        key === "price"
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


    if(!select)
        return;


    const current =
        select.value;


    select.innerHTML =
        '<option value="">Select Product</option>' +

        products
            .map(
                product =>
                    `<option value="${escapeHTML(product.name)}">
                        ${escapeHTML(product.name)}
                    </option>`
            )
            .join("");


    select.value =
        current;
}


/* =========================================================
   REPORTS
========================================================= */

function displayReports(){

    const monthSales =
        document.getElementById(
            "monthSales"
        );

    if(!monthSales)
        return;


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
                date.getMonth() === month &&
                date.getFullYear() === year
            );
        });


    const sales =
        monthlyOrders.reduce(
            (sum,order)=>
                sum + Number(
                    order.total || 0
                ),
            0
        );


    const received =
        monthlyOrders.reduce(
            (sum,order)=>
                sum + Number(
                    order.advance || 0
                ),
            0
        );


    const due =
        monthlyOrders.reduce(
            (sum,order)=>
                sum + Number(
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


    const productMap = {};


    orders.forEach(order=>{

        const product =
            order.product || "Other";

        productMap[product] =
            (
                productMap[product] || 0
            ) + 1;
    });


    document.getElementById(
        "productReport"
    ).innerHTML =

        Object.keys(productMap).length
        ?
        Object.entries(productMap)
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


    const statusMap = {};


    orders.forEach(order=>{

        const status =
            order.status || "New";

        statusMap[status] =
            (
                statusMap[status] || 0
            ) + 1;
    });


    document.getElementById(
        "statusReport"
    ).innerHTML =

        Object.keys(statusMap).length
        ?
        Object.entries(statusMap)
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


/* =========================================================
   SETTINGS
========================================================= */

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

    settings = {

        businessName:
            document
                .getElementById("businessName")
                .value
                .trim(),

        businessPhone:
            document
                .getElementById("businessPhone")
                .value
                .trim(),

        businessWhatsApp:
            document
                .getElementById("businessWhatsApp")
                .value
                .trim(),

        businessEmail:
            document
                .getElementById("businessEmail")
                .value
                .trim(),

        businessAddress:
            document
                .getElementById("businessAddress")
                .value
                .trim()
    };


    saveSettingsData();


    alert(
        "Settings saved."
    );
}


/* =========================================================
   EXPORT
========================================================= */

function exportData(){

    const data = {

        version:"2.0",

        exportedAt:
            nowISO(),

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


    a.href = url;


    a.download =
        "printflow-backup-" +
        todayISO() +
        ".json";


    document.body.appendChild(a);

    a.click();

    a.remove();


    setTimeout(
        ()=>{
            URL.revokeObjectURL(url);
        },
        100
    );
}


/* =========================================================
   IMPORT
========================================================= */

function importData(event){

    const file =
        event.target.files[0];


    if(!file)
        return;


    const reader =
        new FileReader();


    reader.onload =
        async function(event){

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
                    data.orders
                        .map(normalizeOrder)
                        .filter(
                            order => order.id
                        );


                products =
                    Array.isArray(data.products)
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

                refreshAllViews();


                /*
                   Also sync imported orders
                   to Supabase.
                */

                const cloudSaved =
                    await syncAllOrdersToSupabase();


                if(cloudSaved){

                    alert(
                        "Backup imported successfully.\n\n" +
                        "✓ Local data updated\n" +
                        "✓ Supabase synced"
                    );

                }else{

                    alert(
                        "Backup imported locally.\n\n" +
                        "⚠ Some orders could not be synced to Supabase."
                    );
                }

            }catch(error){

                console.error(
                    "Import error:",
                    error
                );

                alert(
                    "Invalid PrintFlow backup file."
                );

            }
        };


    reader.readAsText(file);

    event.target.value = "";
}


/* =========================================================
   CLEAR LOCAL DATA
   IMPORTANT:
   This intentionally does NOT delete Supabase data.
========================================================= */

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


    orders = [];


    products =
        defaultProducts.map(
            ([name,price])=>({
                name,
                price
            })
        );


    settings = {

        businessName:
            "PrintFlow Printing Business",

        businessPhone:"",

        businessWhatsApp:"",

        businessEmail:"",

        businessAddress:""
    };


    refreshAllViews();


    alert(
        "Local data cleared."
    );
}


/* =========================================================
   WHATSAPP
========================================================= */

function normalizeIndianPhone(phone){

    let number =
        String(phone || "")
            .replace(/\D/g,"");


    if(number.startsWith("91") && number.length === 12)
        return number;


    if(number.length === 10)
        return "91" + number;


    return number;
}


function sendWhatsApp(orderID){

    const order =
        orders.find(
            x => x.id === orderID
        );


    if(!order)
        return;


    const phone =
        normalizeIndianPhone(
            order.phone
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
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(message),
        "_blank"
    );
}


function sendCustomerWhatsApp(
    phone,
    name
){

    const number =
        normalizeIndianPhone(phone);


    if(!number)
        return;


    const message =
        `Hello ${name}, this is ${settings.businessName}. Thank you for choosing us.`;


    window.open(
        "https://wa.me/" +
        number +
        "?text=" +
        encodeURIComponent(message),
        "_blank"
    );
}


/* =========================================================
   PRINT INVOICE
========================================================= */

function printInvoice(orderID){

    const order = orders.find(x => x.id === orderID);

    if(!order){
        alert("Order not found.");
        return;
    }

    /* =====================================================
       TAX INVOICE SETTINGS
       GSTIN / bank / UPI can be stored in settings later.
       Safe defaults keep old PrintFlow orders working.
    ===================================================== */

    const businessName = settings.businessName || "PrintFlow Printing Business";
    const businessAddress = settings.businessAddress || "";
    const businessPhone = settings.businessPhone || "";
    const businessEmail = settings.businessEmail || "";
    const businessGSTIN = settings.businessGSTIN || "";
    const businessState = settings.businessState || "Uttar Pradesh";
    const businessStateCode = settings.businessStateCode || "09";
    const placeOfSupply = settings.placeOfSupply || businessState;
    const terms = settings.invoiceTerms || "Net 15";
    const subject = settings.invoiceSubject || "Digital Prints";
    const bankName = settings.bankName || "";
    const bankAccount = settings.bankAccount || "";
    const bankIFSC = settings.bankIFSC || "";
    const bankBranch = settings.bankBranch || "";
    const upiId = settings.upiId || "";

    /*
       Existing PrintFlow stores one order total.
       We treat that value as the FINAL invoice total,
       inclusive of GST, so the invoice never changes the
       amount already saved in the order.

       Default GST = 18% (CGST 9% + SGST 9%).
       Change settings.cgstRate / settings.sgstRate if required.
    */
    const cgstRate = Number(settings.cgstRate ?? 9);
    const sgstRate = Number(settings.sgstRate ?? 9);
    const totalGSTRate = cgstRate + sgstRate;
    const grandTotal = Number(order.total || 0);

    const taxableValue = totalGSTRate > 0
        ? grandTotal / (1 + totalGSTRate / 100)
        : grandTotal;

    const cgstAmount = taxableValue * cgstRate / 100;
    const sgstAmount = taxableValue * sgstRate / 100;
    const subTotal = taxableValue;

    const invoiceNo =
        settings.invoicePrefix
        ? `${settings.invoicePrefix}-${order.id}`
        : order.id;

    const invoiceDate =
        dateLabel(order.invoiceDate || order.createdAt || todayISO());

    const dueDate = order.deliveryDate
        ? dateLabel(order.deliveryDate)
        : dateLabel(todayISO());

    const descriptionParts = [
        order.product,
        order.size ? `Size: ${order.size}` : "",
        order.material ? `Material: ${order.material}` : "",
        order.printing ? `Printing: ${order.printing}` : "",
        order.finishing ? `Finishing: ${order.finishing}` : "",
        order.notes ? `Notes: ${order.notes}` : ""
    ].filter(Boolean);

    const description = descriptionParts.join("\n");
    const qty = Number(order.quantity || 0);
    const rate = qty > 0 ? subTotal / qty : subTotal;
    const amountWords = numberToIndianWords(grandTotal);

    const customerName = order.customer || "Customer";
    const customerPhone = order.phone || "";
    const customerEmail = order.email || "";
    const customerGSTIN = order.gstin || order.customerGSTIN || "";
    const customerAddress = order.address || order.customerAddress || "";

    const qrData = upiId
        ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${grandTotal.toFixed(2)}&cu=INR`
        : "";

    const qrHtml = qrData
        ? `<div class="qr-wrap">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" alt="UPI QR">
                <div>Scan to Pay</div>
           </div>`
        : `<div class="qr-placeholder">UPI QR<br><small>Add UPI ID in Settings</small></div>`;

    const win = window.open("", "_blank", "width=1000,height=1000");

    if(!win){
        alert("Please allow popups to print the invoice.");
        return;
    }

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tax Invoice - ${escapeHTML(invoiceNo)}</title>
<style>
    @page{size:A4 portrait;margin:8mm}
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}
    body{font-size:10.5px}
    .invoice{width:194mm;min-height:280mm;margin:0 auto;border:1px solid #222;background:#fff}
    .row{display:flex}
    .cell{border-right:1px solid #222;border-bottom:1px solid #222;padding:6px 7px}
    .cell:last-child{border-right:0}
    .no-border{border:0!important}

    .header{min-height:26mm;display:flex;border-bottom:1px solid #222}
    .company{flex:1;padding:8px 9px}
    .company-name{font-size:18px;font-weight:700;margin-bottom:5px}
    .company-line{line-height:1.45}
    .tax-title{width:62mm;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:500;border-left:1px solid #222}

    .meta-left{width:55%;border-right:1px solid #222}
    .meta-right{width:45%}
    .meta-row{display:flex;min-height:7mm;border-bottom:1px solid #222}
    .meta-row:last-child{border-bottom:0}
    .meta-label{width:35%;padding:5px 7px;font-weight:600}
    .meta-value{flex:1;padding:5px 7px}

    .two-col>div{width:50%;min-height:35mm}
    .box-title{font-weight:700;margin-bottom:5px}
    .customer-name{font-size:13px;font-weight:700;margin-bottom:3px}
    .address{white-space:pre-line;line-height:1.35}

    .subject{min-height:14mm;padding:7px;border-bottom:1px solid #222}
    .subject b{display:block;margin-bottom:4px}

    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th,td{border-right:1px solid #222;border-bottom:1px solid #222;padding:5px 5px;vertical-align:top}
    th:last-child,td:last-child{border-right:0}
    th{font-weight:700;text-align:center;background:#fafafa}
    .center{text-align:center}
    .right{text-align:right}
    .item-desc{white-space:pre-line;line-height:1.35;min-height:26mm}
    .small{font-size:9px;color:#333}
    .w-no{width:7%}.w-desc{width:31%}.w-qty{width:9%}.w-rate{width:10%}
    .w-tax{width:10%}.w-taxamt{width:10%}.w-amount{width:13%}

    .summary-row{display:flex;min-height:15mm;border-bottom:1px solid #222}
    .words{width:55%;padding:7px;border-right:1px solid #222}
    .summary{width:45%;padding:0}
    .summary-line{display:flex;justify-content:space-between;padding:5px 7px}
    .grand{font-size:14px;font-weight:700;border-top:1px solid #222;padding-top:6px}

    .lower{display:flex;min-height:50mm}
    .notes{width:55%;padding:7px;border-right:1px solid #222}
    .bank{margin-top:8px;line-height:1.45}
    .signature{width:45%;display:flex;flex-direction:column;justify-content:space-between;padding:7px;text-align:center}
    .signature-company{font-size:13px;font-weight:700;margin-top:8px}
    .signature-space{height:22mm}
    .signature-line{border-top:1px solid #555;padding-top:4px}

    .bottom{display:flex;min-height:48mm;border-top:1px solid #222}
    .qr{width:28%;padding:7px;border-right:1px solid #222;text-align:center}
    .qr img{width:34mm;height:34mm;object-fit:contain}
    .qr-placeholder{width:34mm;height:34mm;border:1px dashed #777;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:10px}
    .einvoice{flex:1;padding:7px}
    .irn{word-break:break-all;font-family:monospace;font-size:9px}

    .print-actions{position:fixed;right:18px;top:18px;display:flex;gap:8px}
    .print-actions button{border:0;background:#111;color:#fff;padding:10px 14px;border-radius:6px;cursor:pointer;font-weight:700}
    .print-actions button.secondary{background:#666}

    @media print{
        .print-actions{display:none}
        .invoice{width:194mm;min-height:280mm;border:1px solid #222}
        body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
</style>
</head>
<body>
<div class="print-actions">
    <button onclick="window.print()">Print Invoice</button>
    <button class="secondary" onclick="window.close()">Close</button>
</div>

<div class="invoice">
    <div class="header">
        <div class="company">
            <div class="company-name">${escapeHTML(businessName)}</div>
            <div class="company-line">${escapeHTML(businessAddress)}</div>
            ${businessPhone ? `<div class="company-line">Phone: ${escapeHTML(businessPhone)}</div>` : ""}
            ${businessEmail ? `<div class="company-line">Email: ${escapeHTML(businessEmail)}</div>` : ""}
            ${businessGSTIN ? `<div class="company-line"><b>GSTIN:</b> ${escapeHTML(businessGSTIN)}</div>` : ""}
        </div>
        <div class="tax-title">TAX INVOICE</div>
    </div>

    <div class="row">
        <div class="meta-left">
            <div class="meta-row"><div class="meta-label">Invoice No.</div><div class="meta-value"><b>${escapeHTML(invoiceNo)}</b></div></div>
            <div class="meta-row"><div class="meta-label">Invoice Date</div><div class="meta-value">${escapeHTML(invoiceDate)}</div></div>
            <div class="meta-row"><div class="meta-label">Terms</div><div class="meta-value">${escapeHTML(terms)}</div></div>
            <div class="meta-row"><div class="meta-label">Due Date</div><div class="meta-value">${escapeHTML(dueDate)}</div></div>
            <div class="meta-row"><div class="meta-label">E-Way Bill #</div><div class="meta-value">${escapeHTML(order.eWayBill || order.ewayBill || "")}</div></div>
        </div>
        <div class="meta-right">
            <div class="meta-row"><div class="meta-label">Place of Supply</div><div class="meta-value">${escapeHTML(placeOfSupply)} (${escapeHTML(businessStateCode)})</div></div>
        </div>
    </div>

    <div class="row two-col">
        <div class="cell">
            <div class="box-title">Bill To</div>
            <div class="customer-name">${escapeHTML(customerName)}</div>
            <div class="address">${escapeHTML(customerAddress || customerPhone || "")}</div>
            ${customerEmail ? `<div class="address">${escapeHTML(customerEmail)}</div>` : ""}
            ${customerGSTIN ? `<div class="address"><b>GSTIN:</b> ${escapeHTML(customerGSTIN)}</div>` : ""}
        </div>
        <div class="cell">
            <div class="box-title">Ship To</div>
            <div class="customer-name">${escapeHTML(customerName)}</div>
            <div class="address">${escapeHTML(customerAddress || "")}</div>
            ${customerGSTIN ? `<div class="address"><b>GSTIN:</b> ${escapeHTML(customerGSTIN)}</div>` : ""}
        </div>
    </div>

    <div class="subject">
        <b>Subject:</b>
        ${escapeHTML(subject)}
    </div>

    <table>
        <thead>
            <tr>
                <th class="w-no">#</th>
                <th class="w-desc">Item &amp; Description</th>
                <th class="w-qty">Qty</th>
                <th class="w-rate">Rate</th>
                <th class="w-tax">CGST<br>%</th>
                <th class="w-taxamt">CGST<br>Amt</th>
                <th class="w-tax">SGST<br>%</th>
                <th class="w-taxamt">SGST<br>Amt</th>
                <th class="w-amount">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="center">1</td>
                <td class="item-desc">${escapeHTML(description)}</td>
                <td class="center">${qty.toLocaleString("en-IN")}<br><span class="small">pcs</span></td>
                <td class="right">${money(rate)}</td>
                <td class="center">${cgstRate}%</td>
                <td class="right">${money(cgstAmount)}</td>
                <td class="center">${sgstRate}%</td>
                <td class="right">${money(sgstAmount)}</td>
                <td class="right"><b>${money(grandTotal)}</b></td>
            </tr>
        </tbody>
    </table>

    <div class="summary-row">
        <div class="words">
            <b>Total In Words</b>
            <div style="margin-top:7px;font-weight:700;font-style:italic">${escapeHTML(amountWords)}</div>
        </div>
        <div class="summary">
            <div class="summary-line"><span>Sub Total</span><b>${money(subTotal)}</b></div>
            <div class="summary-line"><span>CGST (${cgstRate}%)</span><b>${money(cgstAmount)}</b></div>
            <div class="summary-line"><span>SGST (${sgstRate}%)</span><b>${money(sgstAmount)}</b></div>
            <div class="summary-line grand"><span>Total</span><b>${money(grandTotal)}</b></div>
        </div>
    </div>

    <div class="lower">
        <div class="notes">
            <b>Notes</b>
            <div style="white-space:pre-line;margin-top:5px">${escapeHTML(order.notes || "")}</div>
            ${bankName || bankAccount || bankIFSC || bankBranch ? `
                <div class="bank">
                    <b>Bank Details for Transfer:</b><br>
                    Company Name: ${escapeHTML(businessName)}<br>
                    ${bankName ? `Bank: ${escapeHTML(bankName)}<br>` : ""}
                    ${bankAccount ? `Bank Account No: ${escapeHTML(bankAccount)}<br>` : ""}
                    ${bankIFSC ? `RTGS/NEFT/IFSC Code: ${escapeHTML(bankIFSC)}<br>` : ""}
                    ${bankBranch ? `Branch: ${escapeHTML(bankBranch)}` : ""}
                </div>` : ""}
        </div>
        <div class="signature">
            <div class="signature-company">${escapeHTML(businessName)}</div>
            <div class="signature-space"></div>
            <div class="signature-line">Authorized Signature</div>
        </div>
    </div>

    <div class="bottom">
        <div class="qr">
            ${qrHtml}
        </div>
        <div class="einvoice">
            <b>e-Invoice Details</b>
            <div style="margin-top:8px">IRN:</div>
            <div class="irn">${escapeHTML(order.irn || order.IRN || "")}</div>
            <div style="margin-top:7px">Ack No.: <b>${escapeHTML(order.ackNo || order.ackNumber || "")}</b></div>
            <div style="margin-top:5px">Ack Date: <b>${escapeHTML(order.ackDate || "")}</b></div>
            <div style="margin-top:14px" class="small">E-invoicing details are shown only when they have been entered in the order data.</div>
        </div>
    </div>
</div>

<script>
window.addEventListener("load", function(){
    setTimeout(function(){ window.focus(); }, 100);
});
</script>
</body>
</html>`);

    win.document.close();
    win.focus();
}


/* =========================================================
   INDIAN NUMBER TO WORDS
========================================================= */

function numberToIndianWords(value){

    let n = Math.round(Number(value || 0));

    if(n === 0)
        return "Indian Rupee Zero Only";

    function twoDigits(num){
        const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
        const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
        if(num < 20) return ones[num];
        return tens[Math.floor(num/10)] + (num%10 ? " " + ones[num%10] : "");
    }

    function underThousand(num){
        let out = "";
        if(num >= 100){
            out += twoDigits(Math.floor(num/100)) + " Hundred";
            num %= 100;
            if(num) out += " ";
        }
        if(num) out += twoDigits(num);
        return out;
    }

    const parts = [];
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;

    if(crore) parts.push(underThousand(crore) + " Crore");
    if(lakh) parts.push(underThousand(lakh) + " Lakh");
    if(thousand) parts.push(underThousand(thousand) + " Thousand");
    if(n) parts.push(underThousand(n));

    return "Indian Rupee " + parts.join(" ") + " Only";
}


/* =========================================================
   REFRESH ALL VIEWS
========================================================= */

function refreshAllViews(){

    updateDashboard();

    displayOrders();

    displayCustomers();

    displayProducts();

    displayReports();

    loadSettings();

    updatePaymentPreview();
}


/* =========================================================
   SEARCH / FILTER LISTENERS
========================================================= */

const searchOrderEl =
    document.getElementById(
        "searchOrder"
    );

if(searchOrderEl){

    searchOrderEl.addEventListener(
        "input",
        displayOrders
    );
}


const filterStatusEl =
    document.getElementById(
        "filterStatus"
    );

if(filterStatusEl){

    filterStatusEl.addEventListener(
        "change",
        displayOrders
    );
}


const filterPaymentEl =
    document.getElementById(
        "filterPayment"
    );

if(filterPaymentEl){

    filterPaymentEl.addEventListener(
        "change",
        displayOrders
    );
}


const searchCustomerEl =
    document.getElementById(
        "searchCustomer"
    );

if(searchCustomerEl){

    searchCustomerEl.addEventListener(
        "input",
        displayCustomers
    );
}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event=>{

        if(event.key === "Escape"){

            closeModal();
        }
    }
);


/* =========================================================
   SUPABASE TEST
========================================================= */

async function testSupabase(){

    if(!supabaseClient){

        console.error(
            "Supabase client not configured."
        );

        return false;
    }


    try{

        const { data,error } =
            await supabaseClient
                .from(SUPABASE_TABLE)
                .select("id")
                .limit(1);


        if(error){

            console.error(
                "SUPABASE ERROR:",
                error
            );

            return false;
        }


        console.log(
            "SUPABASE CONNECTED:",
            data
        );

        supabaseConnected = true;

        return true;

    }catch(error){

        console.error(
            "SUPABASE TEST ERROR:",
            error
        );

        return false;
    }
}


/* =========================================================
   INITIALIZE
========================================================= */

syncProductOptions();

updateDashboard();

updatePaymentPreview();

displayOrders();

displayCustomers();

displayReports();

loadSettings();

/*
   First show LocalStorage immediately.
   Then merge Supabase in background.
*/

loadOrdersFromSupabase();

console.log(
    "PrintFlow 2.0 initialized."
);
