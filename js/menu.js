async function fetchMenuFromAPI() {
    const cacheKey = "menuCache_" + restaurantId + "_" + finalBranchId;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        menuData = JSON.parse(cached);

        // Build UI exactly like API would
        buildCategoryButtons();

        if (!menuData[currentCategory]) {
            currentCategory = Object.keys(menuData)[0];
        }
        loadMenu(menuData[currentCategory]);
    }

    try {
        // ⏱️ Create timeout controller
        const controller = new AbortController();

        // Cancel request if slow network
        const timeout = setTimeout(() => controller.abort(), 8000); // 8 sec

        const response = await fetch(
            `https://rimmyemail01.app.n8n.cloud/webhook/get-menu?rid=${restaurantId}&bid=${finalBranchId}`,
            { signal: controller.signal }
        );

        // Clear timeout if success
        clearTimeout(timeout);

        const data = await response.json();
        console.log("Menu API response:", data);

        menuData = {};

        // ===== HANDLE ROOT ARRAY OR OBJECT =====
        const root = Array.isArray(data) ? data[0] : data;

        // ===== 🔥 SET RESTAURANT NAME DYNAMICALLY =====
        const restaurantName = root?.restaurantName || "Restaurant";

        document.getElementById("restaurantName").innerText =
            restaurantName + " Digital Menu";

        // ===== GET CATEGORIES =====
        const categoriesArray =
            root?.categories ||
            root?.menu ||
            root?.data ||
            [];

        if (!Array.isArray(categoriesArray) || categoriesArray.length === 0) {
            console.warn("No menu categories found in API response.");
            showDialog("Menu is empty for ", restaurantName);
            return;
        }

        categoriesArray.forEach(cat => {
            if (cat && cat.name && Array.isArray(cat.items)) {
                menuData[cat.name] = cat.items.map(item => ({
                    id: item.id || "",
                    name: item.name || "Unnamed Item",
                    price: item.price || 0
                }));
            }
        });

        buildCategoryButtons();

        if (!menuData[currentCategory]) {
            currentCategory = Object.keys(menuData)[0];
        }

        // Save selected category
        localStorage.setItem("currentCategory", currentCategory);

        // Highlight active button
        let activeBtn = null;

        document.querySelectorAll(".category-btn").forEach(btn => {

            const isActive = btn.innerText === currentCategory;
            btn.classList.toggle("active", isActive);

            if (isActive) activeBtn = btn;
        });

        if (activeBtn) {
            activeBtn.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest"
            });
        }

        localStorage.setItem(cacheKey, JSON.stringify(menuData));

        loadMenu(menuData[currentCategory]);

    } catch (err) {

        if (err.name === "AbortError") {
            showDialog("Network is slow. Please check Wi-Fi or try again.");
        } else {
            showDialog("Unable to load menu. Please try again.");
        }

        console.error("Menu load failed:", err);

    }

    function buildCategoryButtons() {

        const container = document.querySelector(".categories");
        container.innerHTML = "";

        Object.keys(menuData).forEach(cat => {

            const btn = document.createElement("button");
            btn.className = "category-btn";
            btn.innerText = cat;

            if (cat === currentCategory) btn.classList.add("active");

            btn.onclick = () => loadCategory(cat, btn);

            container.appendChild(btn);
        });
    }

    function loadCategory(category, btn) {

        currentCategory = category;
        localStorage.setItem("currentCategory", category);

        document.querySelectorAll(".category-btn").forEach(b => {
            b.classList.toggle("active", b === btn);
        });

        // 👉 Scroll category into center view
        if (btn) {
            btn.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest"
            });
        }

        loadMenu(menuData[category]);
    }

    /* LOAD MENU */
    function loadMenu(data) {
        const container = document.getElementById("menuContainer");
        if (!container) {
            console.error("menuContainer not found in DOM");
            return;
        }
        let html = "";

        data.forEach(item => {
            const savedQty = cart[item.id] || 0;

            html += `
    <div class="menu-item">
        <img loading="lazy" src="https://picsum.photos/300/200?random=${item.id}">
        <div class="menu-content">
            <b>${item.name}</b><br>
            Fresh prepared delicious item.<br>
            AED ${item.price}
            <button class="qty-btn minus" onclick="updateQty('${item.id}',-1)">-</button>
            <span class="qty" id="qty-${item.id}">${savedQty}</span>
            <button class="qty-btn plus" onclick="updateQty('${item.id}',1)">+</button>
        </div>
    </div>`;
        });

        container.innerHTML = html;

        calculate();
    }

    /* UPDATE QTY */
    function updateQty(id, change) {
        const el = document.getElementById("qty-" + id);
        let qty = parseInt(el.innerText) + change;
        if (qty < 0) qty = 0;
        el.innerText = qty;

        if (qty === 0) delete cart[id];
        else cart[id] = qty;

        localStorage.setItem("cart", JSON.stringify(cart));
        calculate();
        document.getElementById("resetBtn").disabled = Object.keys(cart).length === 0;
    }

    /* CALCULATE */
    function calculate() {
        let subtotal = 0;
        Object.keys(cart).forEach(id => {
            Object.values(menuData).forEach(cat => {
                cat.forEach(i => {
                    if (i.id === id) subtotal += i.price * cart[id];
                });
            });
        });

        let vat = subtotal * 0.05;
        let total = subtotal + vat;

        document.getElementById("subtotal").innerText = subtotal.toFixed(2);
        document.getElementById("vat").innerText = vat.toFixed(2);
        document.getElementById("total").innerText = total.toFixed(2);
    }

    /* GLOBAL SEARCH WITH CATEGORY AUTO SELECT */
    function searchMenu() {
        const val = document.getElementById("searchBox").value.toLowerCase();

        if (val === "") {

            const activeBtn = [...document.querySelectorAll(".category-btn")]
                .find(btn => btn.innerText === currentCategory);

            if (activeBtn) loadCategory(currentCategory, activeBtn);

            return;
        }

        let results = [];
        let foundCategory = null;

        Object.keys(menuData).forEach(cat => {
            menuData[cat].forEach(item => {
                if (item.name.toLowerCase().includes(val)) {
                    results.push(item);
                    foundCategory = cat;
                }
            });
        });

        if (foundCategory) {

            currentCategory = foundCategory;
            localStorage.setItem("currentCategory", currentCategory);

            // Highlight correct category button
            let activeBtn = null;

            document.querySelectorAll(".category-btn").forEach(btn => {

                const isActive = btn.innerText === currentCategory;
                btn.classList.toggle("active", isActive);

                if (isActive) activeBtn = btn;
            });

            // 👉 Scroll active category into view
            if (activeBtn) {
                activeBtn.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest"
                });
            }
        }

        if (results.length === 0) {

            document.getElementById("menuContainer").style.display = "none";
            document.getElementById("noResults").style.display = "flex";

            showDidYouMean(val);
            showPopularItems();
            showSuggestedCategories();

        } else {

            document.getElementById("menuContainer").style.display = "grid";
            document.getElementById("noResults").style.display = "none";

            loadMenu(results);
        }
    }

    function getAllItems() {
        let items = [];
        Object.values(menuData).forEach(cat => items.push(...cat));
        return items;
    }

    function showPopularItems() {

        const all = getAllItems();

        const shuffled = all.sort(() => 0.5 - Math.random());
        const popular = shuffled.slice(0, 5);

        const container = document.getElementById("popularItems");
        container.innerHTML = "";

        popular.forEach(item => {
            const el = document.createElement("div");
            el.className = "popular-item";
            el.innerText = item.name;
            el.onclick = () => {
                document.getElementById("searchBox").value = item.name;
                searchMenu();
            };
            container.appendChild(el);
        });
    }

    function showSuggestedCategories() {

        const container = document.getElementById("suggestedCategories");
        container.innerHTML = "";

        Object.keys(menuData).slice(0, 6).forEach(cat => {

            const btn = document.createElement("button");
            btn.innerText = cat;

            btn.onclick = () => {
                clearSearch();
                const categoryBtn = [...document.querySelectorAll(".category-btn")]
                    .find(b => b.innerText === cat);
                if (categoryBtn) loadCategory(cat, categoryBtn);
            };

            container.appendChild(btn);
        });
    }

    function showDidYouMean(searchText) {

        const all = getAllItems();

        let suggestion = all.find(item =>
            item.name.toLowerCase().includes(searchText.slice(0, 3))
        );

        const box = document.getElementById("didYouMean");

        if (suggestion) {

            box.innerHTML = `Did you mean: <b>${suggestion.name}</b>?`;

            box.onclick = () => {
                document.getElementById("searchBox").value = suggestion.name;
                searchMenu();
            };

        } else {
            box.innerHTML = "";
        }
    }

    function clearSearch() {

        const box = document.getElementById("searchBox");
        box.value = "";

        document.getElementById("noResults").style.display = "none";
        document.getElementById("menuContainer").style.display = "grid";

        const activeBtn = [...document.querySelectorAll(".category-btn")]
            .find(btn => btn.innerText === currentCategory);

        if (activeBtn) loadCategory(currentCategory, activeBtn);
    }
}