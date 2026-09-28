const navLinks = document.querySelectorAll (".nav-menu .nav-link");
const menuOpenButton = document.querySelector ("#menu-open-button");
const menuCloseButton = document.querySelector ("#menu-close-button");

menuOpenButton.addEventListener("click", () => {
    // Toggle mobile menu visibility
    document.body.classList.toggle("show-mobile-menu");
});

// Close menu when the close button is clicked
menuCloseButton.addEventListener("click", () => menuOpenButton.click());

// Close menu when the nav link is clicked
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        // Only close mobile menu
        document.body.classList.remove("show-mobile-menu");
        if (
            link.getAttribute("href") === "#my-capsule" &&
            connectedAccount
        ) {
            loadMyCapsules();
        }
    });
});

/* =========================================================
   INTERACTIVE LIQUID CHROME SHAPE
   The shape reacts to the cursor in three ways:
   1) it drifts / tilts toward the pointer (parallax)
   2) the metallic gradient rotates faster near the pointer
   3) the liquid "wobble" (SVG turbulence + specular light)
      intensifies with pointer speed, then settles back down
========================================================= */

const heroSection   = document.querySelector("#hero");
const hologramWrap  = document.querySelector("#hero-hologram");
const turbulence    = document.querySelector("#turbulence");
const displaceMap   = document.querySelector("#displace");
const lightSource   = document.querySelector("#lightSource");

if (heroSection && hologramWrap && turbulence && displaceMap) {

    let targetX = 0.5;   // 0..1 normalized pointer position within hero
    let targetY = 0.5;

    let currentX = 0.5;
    let currentY = 0.5;

    let lastPointerX = 0.5;
    let lastPointerY = 0.5;

    let energy = 0;       // how "excited" the liquid wobble is right now
    let targetEnergy = 0;

    const baseScale = 100;   // resting liquid displacement (big folded waves)
    const maxScale  = 190;   // peak displacement while moving fast

    const baseFreqX = 0.0035;
    const baseFreqY = 0.006;

    heroSection.addEventListener("pointermove", (e) => {

        const rect = heroSection.getBoundingClientRect();

        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        targetX = Math.min(Math.max(px, 0), 1);
        targetY = Math.min(Math.max(py, 0), 1);

        // Measure pointer speed to drive the liquid "wobble" energy
        const dx = targetX - lastPointerX;
        const dy = targetY - lastPointerY;
        const speed = Math.sqrt(dx * dx + dy * dy);

        targetEnergy = Math.min(speed * 18, 1);

        lastPointerX = targetX;
        lastPointerY = targetY;

        // Move the specular highlight with the cursor (viewBox is 1200x700)
        if (lightSource) {
            lightSource.setAttribute("x", 1200 * targetX);
            lightSource.setAttribute("y", 700 * targetY);
        }
    });

    heroSection.addEventListener("pointerleave", () => {
        targetX = 0.5;
        targetY = 0.5;
        targetEnergy = 0;
    });

    function animateHologram() {

        // Fully dissolved & hidden: don't burn CPU re-rendering the filter
        if (heroSection.style.visibility === "hidden") {
            requestAnimationFrame(animateHologram);
            return;
        }

        // Smoothly ease toward the pointer position
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;

        energy += (targetEnergy - energy) * 0.08;
        targetEnergy *= 0.94; // let the wobble decay after the cursor stops

        const offsetX = (currentX - 0.5) * 130;  // px drift (full-bleed shape, roomier travel)
        const offsetY = (currentY - 0.5) * 100;
        const rotate  = (currentX - 0.5) * 7;    // subtle tilt

        hologramWrap.style.setProperty("--parallax-x", `${offsetX}px`);
        hologramWrap.style.setProperty("--parallax-y", `${offsetY}px`);
        hologramWrap.style.setProperty("--parallax-rot", `${rotate}deg`);

        // Liquid distortion responds to pointer speed
        const scale = baseScale + energy * (maxScale - baseScale);
        displaceMap.setAttribute("scale", scale.toFixed(1));

        const freqX = baseFreqX + energy * 0.004 + currentX * 0.0015;
        const freqY = baseFreqY + energy * 0.005 + currentY * 0.0015;
        turbulence.setAttribute("baseFrequency", `${freqX.toFixed(4)} ${freqY.toFixed(4)}`);

        requestAnimationFrame(animateHologram);
    }

    animateHologram();
}

/* =========================================================
   HERO → ABOUT PARALLAX REVEAL
   The hero is pinned in place (position: fixed). As the About
   section scrolls up over it, its background fades from
   transparent to solid — the fixed hero dissolves underneath
   instead of being cut off at a hard edge.
========================================================= */

const heroVeil = document.querySelector("#hero-veil");
const heroContent = document.querySelector("#hero .section-content");

function updateHeroReveal() {

    // 0 at the top of the page -> 1 after ~85% of a screen of scrolling
    let progress = window.scrollY / (window.innerHeight * 0.85);
    progress = Math.min(Math.max(progress, 0), 1);

    // Whole viewport dissolves into one flat color
    if (heroVeil) heroVeil.style.opacity = progress.toFixed(3);

    // Liquid chrome melts away
    if (hologramWrap) hologramWrap.style.opacity = String(1 - progress);

    // Hero copy drifts up slower than the page (parallax) and fades quickly
    if (heroContent) {
        heroContent.style.transform = `translateY(${(-progress * 90).toFixed(1)}px)`;
        heroContent.style.opacity = String(Math.max(1 - progress * 2.5, 0));
    }

    // Once fully dissolved, stop rendering / catching clicks on the pinned hero
    if (heroSection) {
        const hidden = progress >= 1;
        heroSection.style.visibility = hidden ? "hidden" : "visible";

        const heroSvg = document.querySelector("#chrome-blob");
        if (heroSvg && heroSvg.pauseAnimations) {
            hidden ? heroSvg.pauseAnimations() : heroSvg.unpauseAnimations();
        }
    }
}

window.addEventListener("scroll", updateHeroReveal, { passive: true });
window.addEventListener("resize", updateHeroReveal);
updateHeroReveal();

/* =========================================================
   NAVBAR: stays transparent over the hero, gains a soft solid
   background once the user scrolls into the page content, so
   it never visually collides with scrolling text underneath.
========================================================= */

const siteHeader = document.querySelector("header");

if (siteHeader) {

    function updateNavBackground() {

        const navHeight = siteHeader.offsetHeight;

        if (window.scrollY > window.innerHeight - navHeight) {
            siteHeader.classList.add("nav-solid");
        } else {
            siteHeader.classList.remove("nav-solid");
        }
    }

    window.addEventListener("scroll", updateNavBackground, { passive: true });
    window.addEventListener("resize", updateNavBackground);
    updateNavBackground();
}

/* =========================================================
   SCROLL REVEAL for the split (heading | content) sections
   Heading + content slide in from the right and fade in the
   first time each section enters the viewport.
========================================================= */

const revealSections = document.querySelectorAll(".split-section");

function checkReveal() {

    // Reveal once a section's top passes 75% of the viewport height, or if
    // it has already been scrolled past (fast scrolling / jump links).
    revealSections.forEach((section) => {

        if (section.classList.contains("is-visible")) return;

        const rect = section.getBoundingClientRect();

        if (rect.top < window.innerHeight * 0.75) {
            section.classList.add("is-visible");
        }
    });
}

window.addEventListener("scroll", checkReveal, { passive: true });
window.addEventListener("resize", checkReveal);
checkReveal();

/* Liquid glow behind the Create form: drifts with the pointer, and only
   animates while the section is actually on screen (keeps scrolling smooth). */
const createSectionEl = document.querySelector("#create");
const createLiquid = document.querySelector("#create-liquid");
const createTurb = document.querySelector("#create-turb");
const createGrad = document.querySelector("#createChromeGradient");

if (createSectionEl && createLiquid) {

    createSectionEl.addEventListener("pointermove", (e) => {
        const r = createSectionEl.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        createLiquid.style.setProperty("--cl-x", `${(nx * 60).toFixed(1)}px`);
        createLiquid.style.setProperty("--cl-y", `${(ny * 40).toFixed(1)}px`);
    });

    let createOnScreen = false;
    let createRunning = false;
    let createLast = 0;

    function createLoop(t) {

        if (!createOnScreen) {
            createRunning = false;
            return;
        }

        // ~20 fps is plenty for a slow ambient drift
        if (t - createLast > 50) {
            createLast = t;

            if (createGrad) {
                createGrad.setAttribute("gradientTransform",
                    `rotate(${((t / 1000) * 14 % 360).toFixed(1)} 0.5 0.5)`);
            }

            if (createTurb) {
                const k = Math.sin(t / 4500);
                createTurb.setAttribute("baseFrequency",
                    `${(0.0055 + 0.0012 * k).toFixed(4)} ${(0.009 + 0.0015 * k).toFixed(4)}`);
            }
        }

        requestAnimationFrame(createLoop);
    }

    if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            createOnScreen = entries[0].isIntersecting;
            if (createOnScreen && !createRunning) {
                createRunning = true;
                requestAnimationFrame(createLoop);
            }
        }).observe(createSectionEl);
    }
}

// CREATE CAPSULE

const capsuleForm = document.querySelector("#capsule-form");

const createSection = document.querySelector(".create-section");
const reviewSection = document.querySelector(".review-section");

const capsuleTitle = document.querySelector("#capsule-title");
const capsuleMessage = document.querySelector("#capsule-message");
const unlockDate = document.querySelector("#unlock-date");
unlockDate.addEventListener("change", () => {
    document.querySelector("#date-error").textContent = "";
});

const previewTitle = document.querySelector("#preview-title");
const previewMessage = document.querySelector("#preview-message");
const previewDate = document.querySelector("#preview-date");

const editCapsuleButton = document.querySelector("#edit-capsule");
const continueWalletButton = document.querySelector("#continue-wallet");

// WALLET + SMART CONTRACT
// WALLET ELEMENTS
const walletSection = document.querySelector(".wallet-section");

const connectWalletButton = document.querySelector("#connect-wallet-button");

const saveCapsuleButton = document.querySelector("#save-capsule-button");

const navConnectWallet = document.querySelector("#nav-connect-wallet");

const walletStatus = document.querySelector("#wallet-status");
const walletBox = document.querySelector("#wallet-box");
const walletText = document.querySelector("#wallet-text");
const walletIcon = document.querySelector("#wallet-icon");
const walletBadgeAddress = document.querySelector("#wallet-badge-address");
const viewCapsulesButton = document.querySelector("#view-capsules-button");
const createAnotherButton = document.querySelector("#create-another-button");
// MY CAPSULE ELEMENTS
// MY CAPSULE ELEMENTS
const myCapsuleSection = document.querySelector("#my-capsule");
const myCapsuleList = document.querySelector("#my-capsule-list");
const myCapsuleStatus = document.querySelector("#my-capsule-status");

// CAPSULE DETAIL ELEMENTS
const detailSection = document.querySelector("#capsule-detail");
const detailBack = document.querySelector("#detail-back");
const detailVisual = document.querySelector("#detail-visual");
const detailNumber = document.querySelector("#detail-number");
const detailTitle = document.querySelector("#detail-title");
const detailCreated = document.querySelector("#detail-created");
const detailOpens = document.querySelector("#detail-opens");
const detailStatus = document.querySelector("#detail-status");
const detailMessage = document.querySelector("#detail-message");
const detailDeleteButton = document.querySelector("#detail-delete");

// WALLET STATE
let connectedAccount = null;

// WALLET STATE: "disconnected" | "connected" | "saved"
const WALLET_TEXTS = {
    disconnected: "Connect your wallet to save your capsule permanently on-chain.",
    connected: "Your wallet is connected. Your capsule is ready to be saved on-chain.",
    saved: "Your capsule is now saved on-chain. It will be waiting for you."
};

function setWalletState(state) {
    walletBox.dataset.state = state;
    walletText.textContent = WALLET_TEXTS[state];
    walletIcon.className = state === "saved" ? "fas fa-check" : "fas fa-wallet";
}

// NAVBAR WALLET PILL
function setNavWalletConnected(address) {

    navConnectWallet.classList.add("is-connected");
    navConnectWallet.replaceChildren();

    const dot = document.createElement("span");
    dot.className = "nav-wallet-dot";

    const label = document.createElement("span");
    label.textContent = address;

    navConnectWallet.append(dot, label);
}

function setNavWalletDisconnected() {
    navConnectWallet.classList.remove("is-connected");
    navConnectWallet.textContent = "Connect Wallet";
}

// SMOOTH SECTION TRANSITION (fade out old -> swap -> fade in new)
let isSwitching = false;

function switchSection(fromEl, toEl) {

    if (isSwitching) return;
    isSwitching = true;

    fromEl.classList.add("section-leave");

    setTimeout(() => {

        fromEl.style.display = "none";
        fromEl.classList.remove("section-leave");

        toEl.style.display = "block";

        // Align the page to the new section instantly (old one is already faded out)
        window.scrollTo({
            top: toEl.getBoundingClientRect().top + window.scrollY,
            behavior: "instant"
        });

        toEl.classList.add("section-enter");

        setTimeout(() => {
            toEl.classList.remove("section-enter");
            isSwitching = false;
        }, 900);

    }, 450);
}

// SMART CONTRACT CONFIGURATION
const CONTRACT_ADDRESS =
    "0x239FD697bDC211F3831413A1993f22afF3c2EAAC";

// NETWORK: ganti ke "mainnet" saat siap submit
const NETWORK = "testnet";

const EXPLORERS = {
    testnet: "https://scan.bohr.life",
    mainnet: "https://scan.botchain.ai"
};

const EXPLORER_URL = `${EXPLORERS[NETWORK]}/address/${CONTRACT_ADDRESS}?tab=txs`;

document.querySelectorAll(".js-explorer-link").forEach((link) => {
    link.href = EXPLORER_URL;
});

const CONTRACT_ABI = [
    { "anonymous": false, "inputs": [ { 
        "indexed": true, "internalType": "uint256", "name": "capsuleId", "type": "uint256" }, 
        { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, 
        { "indexed": false, "internalType": "string", "name": "title", "type": "string" }, 
        { "indexed": false, "internalType": "uint256", "name": "unlockTime", "type": "uint256" } ], 
        "name": "CapsuleCreated", "type": "event" }, { "inputs": [ { 
            "internalType": "string", "name": "_title", "type": "string" }, 
            { "internalType": "string", "name": "_message", "type": "string" }, 
            { "internalType": "uint256", "name": "_unlockTime", "type": "uint256" } ], 
            "name": "createCapsule", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, 
            { "inputs": [ { "internalType": "uint256", "name": "_capsuleId", "type": "uint256" } ], 
            "name": "deleteCapsule", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, 
            { "inputs": [ { "internalType": "uint256", "name": "_capsuleId", "type": "uint256" } ], 
            "name": "getCapsule", "outputs": [ { "components": [ { "internalType": "uint256", "name": "id", "type": "uint256" }, 
                { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "string", "name": "title", "type": "string" }, 
                { "internalType": "string", "name": "message", "type": "string" }, { "internalType": "uint256", "name": "unlockTime", "type": "uint256" }, 
                { "internalType": "uint256", "name": "createdAt", "type": "uint256" } ], "internalType": "struct TimeCapsule.Capsule", "name": "", "type": "tuple" } ], 
                "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getMyCapsules", "outputs": [ { 
                    "internalType": "uint256[]", "name": "", "type": "uint256[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { 
                        "internalType": "uint256", "name": "_capsuleId", "type": "uint256" } ], "name": "isUnlocked", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }
];

// When Submit is clicked
capsuleForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const title = capsuleTitle.value.trim();
    const message = capsuleMessage.value.trim();
    const date = unlockDate.value;

    if (!title || !message || !date) {
        return;
    }

    // The date must be in the future (same rule the contract flow uses),
    // so catch it here instead of after the user has already reached the wallet page
    const dateError = document.querySelector("#date-error");

    if (new Date(date + "T00:00:00").getTime() <= Date.now()) {
        dateError.textContent = "Please pick a date from tomorrow onwards.";
        return;
    }

dateError.textContent = "";

    previewTitle.textContent = title;
    previewMessage.textContent = message;

    previewDate.textContent = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    // New capsule -> reset the save state
    saveCapsuleButton.disabled = false;
    setWalletState(connectedAccount ? "connected" : "disconnected");

    switchSection(createSection, reviewSection);
});

// EDIT CAPSULE
editCapsuleButton.addEventListener("click", () => {
    switchSection(reviewSection, createSection);
});

// CONTINUE TO WALLET
continueWalletButton.addEventListener("click", () => {
    switchSection(reviewSection, walletSection);
});

// BACK FROM WALLET TO REVIEW
document.querySelector("#wallet-back").addEventListener("click", () => {
    walletStatus.textContent = "";
    switchSection(walletSection, reviewSection);
});

// VIEW MY CAPSULE (after saving)
viewCapsulesButton.addEventListener("click", () => {
    switchSection(walletSection, myCapsuleSection);
});

// CREATE ANOTHER CAPSULE (after saving)
createAnotherButton.addEventListener("click", () => {

    // Form was already cleared after saving; get the wallet box ready for the next round
    saveCapsuleButton.disabled = false;
    setWalletState(connectedAccount ? "connected" : "disconnected");

    switchSection(walletSection, createSection);
});

// If Create is hidden (user is in Review/Wallet), bring it back when a #create link is clicked
document.querySelectorAll('a[href="#create"]').forEach((link) => {
    link.addEventListener("click", () => {
        if (createSection.style.display === "none") {
            reviewSection.style.display = "none";
            walletSection.style.display = "none";
            createSection.style.display = "block";
        }
    });
});

// CONNECT WALLET
async function connectWallet(event) {

    // Prevent default link behavior
    if (event) {
        event.preventDefault();
    }


    // Check if MetaMask / Ethereum wallet exists
    if (!window.ethereum) {

        alert("MetaMask is not installed. Please install MetaMask first.");

        return;
    }


    try {

        // Ask MetaMask to connect
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });


        // Get the first connected account
        connectedAccount = accounts[0];


        // Update wallet UI
        updateWalletUI(connectedAccount);


        console.log("Wallet connected:", connectedAccount);

    } catch (error) {

        console.error("Wallet connection failed:", error);


        // User rejected the connection request
        if (error.code === 4001) {

            alert("You rejected the wallet connection.");

        } else {

            alert("Failed to connect wallet.");

        }

    }

}

// UPDATE WALLET UI
function updateWalletUI(account) {

    if (!account) {
        return;
    }

    const shortAddress =
        account.slice(0, 6) +
        "..." +
        account.slice(-4);

    setNavWalletConnected(shortAddress);
    walletBadgeAddress.textContent = shortAddress;

    // Don't override the "saved" state
    if (walletBox.dataset.state !== "saved") {
        setWalletState("connected");
    }

    walletStatus.textContent = "";

    loadMyCapsules();
}

// SAVE CAPSULE TO BLOCKCHAIN
async function saveCapsuleToBlockchain() {

    if (!window.ethereum) {

        alert(
            "MetaMask is not installed."
        );

        return;
    }

    if (!connectedAccount) {

        alert(
            "Please connect your wallet first."
        );

        return;
    }

    try {

        walletStatus.textContent =
            "Preparing transaction...";

        // Create provider
        const provider =
            new ethers.BrowserProvider(
                window.ethereum
            );

        // Get signer
        const signer =
            await provider.getSigner();

        // Create contract instance
        const contract =
            new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

        // Get capsule data
        const title =
            capsuleTitle.value.trim();

        const message =
            capsuleMessage.value.trim();

        const date =
            unlockDate.value;

        if (!title || !message || !date) {

            alert(
                "Capsule data is incomplete."
            );

            return;
        }

        // Convert date into Unix timestamp
        const unlockTimestamp =
            Math.floor(
                new Date(
                    date + "T00:00:00"
                ).getTime() / 1000
            );

        // Check unlock date
        const currentTimestamp =
            Math.floor(
                Date.now() / 1000
            );

        if (
            unlockTimestamp <=
            currentTimestamp
        ) {

            alert(
                "Unlock date must be in the future."
            );

            return;
        }

        walletStatus.textContent =
        saveCapsuleButton.disabled = true;
            "Please confirm the transaction in MetaMask...";

        // Send transaction
        const transaction =
            await contract.createCapsule(
                title,
                message,
                unlockTimestamp
            );

        console.log(
            "Transaction sent:",
            transaction.hash
        );

        walletStatus.textContent =
            "Transaction submitted. Waiting for confirmation...";

        // Wait for blockchain confirmation
        const receipt =
            await transaction.wait();

        console.log(
            "Transaction confirmed:",
            receipt
        );

        walletStatus.textContent = "";
        setWalletState("saved");
        capsuleForm.reset();
        loadMyCapsules();

    } catch (error) {
        saveCapsuleButton.disabled = false;

        console.error(
            "Save capsule failed:",
            error
        );

        if (error.code === 4001) {

            walletStatus.textContent =
                "Transaction rejected.";

            alert(
                "You rejected the transaction."
            );

        } else {

            walletStatus.textContent =
                "Transaction failed.";

            alert(
                "Failed to save capsule. Check the console for details."
            );
        }
    }

        if (unlockTimestamp <= currentTimestamp) {
            walletStatus.textContent = "Unlock date must be in the future. Go back and pick a later date.";
            return;
        }
}

// MY CAPSULES: DATA + RENDERING
let capsulesCache = [];
let currentCapsule = null;
let loadRun = 0;
let lastRenderSignature = null;

const canTilt = window.matchMedia(
    "(hover: hover) and (prefers-reduced-motion: no-preference)"
).matches;

function formatDate(seconds) {
    return new Date(Number(seconds) * 1000).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// Elements are built with textContent, so titles/messages can never inject HTML
function makeEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function makeStatusPill(unlocked) {
    const pill = makeEl("span", "capsule-status " + (unlocked ? "is-ready" : "is-locked"));
    pill.appendChild(makeEl("i", unlocked ? "fas fa-lock-open" : "fas fa-lock"));
    pill.appendChild(document.createTextNode(unlocked ? "Ready" : "Locked"));
    return pill;
}

function makeDateRow(label, value) {
    const row = makeEl("div", "capsule-date-row");
    row.appendChild(makeEl("span", "", label));
    row.appendChild(makeEl("strong", "", value));
    return row;
}

// Card slides / leans AGAINST the cursor direction
function enableCardTilt(card, inner) {

    if (!canTilt) return;

    card.addEventListener("pointermove", (e) => {

        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        const nx = px * 2 - 1; // -1 (left) .. 1 (right)
        const ny = py * 2 - 1; // -1 (top)  .. 1 (bottom)

        inner.style.setProperty("--tx", `${(-nx * 10).toFixed(1)}px`);
        inner.style.setProperty("--ty", `${(-ny * 8).toFixed(1)}px`);
        inner.style.setProperty("--ry", `${(nx * 9).toFixed(1)}deg`);
        inner.style.setProperty("--rx", `${(-ny * 9).toFixed(1)}deg`);
        inner.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        inner.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    });

    card.addEventListener("pointerleave", () => {
        ["--tx", "--ty", "--rx", "--ry"].forEach((prop) => inner.style.removeProperty(prop));
    });
}

function renderCapsuleCards() {

    myCapsuleList.replaceChildren();

    capsulesCache.forEach((capsule, index) => {

        const card = makeEl("article", "capsule-card");
        card.style.setProperty("--i", index);

        const inner = makeEl("div", "capsule-card-inner");

        const thumb = makeEl("div", "capsule-thumb chrome-surface");
        thumb.style.setProperty("--rot", ((Number(capsule.id) * 67) % 360) + "deg");

        const dates = makeEl("div", "capsule-dates");
        dates.appendChild(makeDateRow("Created", formatDate(capsule.createdAt)));
        dates.appendChild(makeDateRow("Opens", formatDate(capsule.unlockTime)));

        const viewButton = makeEl("button", "capsule-view");
        viewButton.type = "button";
        viewButton.append("View Details ", makeEl("span", "arrow", "\u2192"));

        inner.append(
            thumb,
            makeStatusPill(capsule.unlocked),
            makeEl("h3", "capsule-title", capsule.title),
            dates,
            viewButton
        );

        card.appendChild(inner);

        enableCardTilt(card, inner);
        card.addEventListener("click", () => openCapsuleDetail(capsule));

        myCapsuleList.appendChild(card);
    });
}

// LOAD MY CAPSULES
async function loadMyCapsules() {

    // Any newer call invalidates older in-flight calls (prevents duplicate cards)
    const runId = ++loadRun;

    if (!window.ethereum) {
        myCapsuleList.replaceChildren();
        lastRenderSignature = null;
        myCapsuleStatus.textContent = "MetaMask is not installed.";
        return;
    }

    if (!connectedAccount) {
        myCapsuleList.replaceChildren();
        capsulesCache = [];
        lastRenderSignature = null;
        myCapsuleStatus.textContent = "Connect your wallet to see your capsules.";
        return;
    }

    try {

        myCapsuleStatus.textContent = "Loading your capsules...";

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const capsuleIds = await contract.getMyCapsules();

        const loaded = await Promise.all(capsuleIds.map(async (capsuleId) => {

            const [capsule, unlocked] = await Promise.all([
                contract.getCapsule(capsuleId),
                contract.isUnlocked(capsuleId)
            ]);

            return {
                id: capsule.id,
                title: capsule.title,
                message: capsule.message,
                unlockTime: capsule.unlockTime,
                createdAt: capsule.createdAt,
                unlocked
            };
        }));

        if (runId !== loadRun) return;

        // Newest first
        capsulesCache = loaded.sort((a, b) =>
            Number(b.createdAt) - Number(a.createdAt) || Number(b.id) - Number(a.id)
        );

        if (capsulesCache.length === 0) {
            myCapsuleList.replaceChildren();
            lastRenderSignature = null;
            myCapsuleStatus.textContent = "You don't have any capsules yet.";
            return;
        }

        myCapsuleStatus.textContent = "";

        // Only re-render when something actually changed (avoids replaying animations)
        const signature = capsulesCache.map((c) => `${c.id}:${c.unlocked}`).join("|");

        if (signature !== lastRenderSignature) {
            lastRenderSignature = signature;
            renderCapsuleCards();
        }

    } catch (error) {

        if (runId !== loadRun) return;

        console.error("Failed to load capsules:", error);
        myCapsuleStatus.textContent = "Failed to load your capsules.";
    }
}

// REFRESH CAPSULES WHEN USER RETURNS TO THE PAGE (registered once)
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && connectedAccount) {
        loadMyCapsules();
    }
});

// CAPSULE DETAIL PAGE
function openCapsuleDetail(capsule) {

    currentCapsule = capsule;

    detailVisual.style.setProperty("--rot", ((Number(capsule.id) * 67) % 360) + "deg");
    detailNumber.textContent = "Capsule #" + String(capsule.id).padStart(3, "0");
    detailTitle.textContent = capsule.title;
    detailCreated.textContent = formatDate(capsule.createdAt);
    detailOpens.textContent = formatDate(capsule.unlockTime);
    detailStatus.replaceChildren(makeStatusPill(capsule.unlocked));

    detailMessage.replaceChildren();

    if (capsule.unlocked) {

        detailMessage.className = "detail-message";
        detailMessage.textContent = capsule.message;

    } else {

        const daysLeft = Math.max(
            1,
            Math.ceil((Number(capsule.unlockTime) * 1000 - Date.now()) / 86400000)
        );

        detailMessage.className = "detail-message is-locked";
        detailMessage.appendChild(makeEl("i", "fas fa-lock"));
        detailMessage.appendChild(makeEl(
            "p",
            "",
            `This capsule is still sealed. It opens on ${formatDate(capsule.unlockTime)}, ` +
            `${daysLeft === 1 ? "1 day" : daysLeft + " days"} to go.`
        ));
    }

    detailMessage.scrollTop = 0;

    switchSection(myCapsuleSection, detailSection);
}

detailBack.addEventListener("click", () => {
    switchSection(detailSection, myCapsuleSection);
});

// DELETE FROM THE DETAIL PAGE
const detailDeleteStatus = document.querySelector("#detail-delete-status");
let deleteConfirmTimer = null;

function resetDeleteButton() {
    clearTimeout(deleteConfirmTimer);
    detailDeleteButton.classList.remove("is-confirming");
    detailDeleteButton.textContent = "Delete Capsule";
    detailDeleteButton.disabled = false;
}

detailDeleteButton.addEventListener("click", async () => {

    if (!currentCapsule) return;

    // First click: ask for confirmation right on the button (no browser popup)
    if (!detailDeleteButton.classList.contains("is-confirming")) {

        detailDeleteButton.classList.add("is-confirming");
        detailDeleteButton.textContent = "Click again to confirm";
        detailDeleteStatus.textContent = "This action cannot be undone.";

        deleteConfirmTimer = setTimeout(() => {
            resetDeleteButton();
            detailDeleteStatus.textContent = "";
        }, 4000);

        return;
    }

    // Second click: really delete
    clearTimeout(deleteConfirmTimer);
    detailDeleteButton.disabled = true;
    detailDeleteButton.textContent = "Deleting...";

    try {

        if (!window.ethereum || !connectedAccount) {
            throw new Error("Please connect your wallet first.");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        detailDeleteStatus.textContent = "Please confirm the deletion in MetaMask...";

        const transaction = await contract.deleteCapsule(currentCapsule.id);

        detailDeleteStatus.textContent = "Deleting capsule...";

        await transaction.wait();

        detailDeleteStatus.textContent = "";
        resetDeleteButton();

        await loadMyCapsules();
        switchSection(detailSection, myCapsuleSection);

    } catch (error) {

        console.error("Delete capsule failed:", error);

        resetDeleteButton();

        const rejected =
            error.code === 4001 ||
            error.code === "ACTION_REJECTED" ||
            (error.info && error.info.error && error.info.error.code === 4001);

        detailDeleteStatus.textContent = rejected
            ? "Deletion cancelled."
            : "Failed to delete: " + (error.reason || error.shortMessage || error.message);
    }
});

// Nav "My Capsule" link should also work while the detail page is open
document.querySelectorAll('a[href="#my-capsule"]').forEach((link) => {
    link.addEventListener("click", () => {
        detailSection.style.display = "none";
        myCapsuleSection.style.display = "block";
    });
});

// The hero is position: fixed, so "#hero" anchors can't scroll anywhere.
// Send every #hero link (navbar logo, footer logo) to the top of the page instead.
document.querySelectorAll('a[href="#hero"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        document.body.classList.remove("show-mobile-menu");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});

// BUTTON EVENTS
// CONNECT FROM NAVBAR
navConnectWallet.addEventListener("click", connectWallet);

// CONNECT FROM WALLET SECTION
connectWalletButton.addEventListener("click", connectWallet);

saveCapsuleButton.addEventListener(
    "click",
    saveCapsuleToBlockchain
);

// CHECK EXISTING CONNECTION
async function checkWalletConnection() {

    // Stop if MetaMask isn't installed
    if (!window.ethereum) {
        return;
    }


    try {

        // Get already-connected accounts
        const accounts = await window.ethereum.request({
            method: "eth_accounts"
        });


        if (accounts.length > 0) {

            connectedAccount = accounts[0];

            updateWalletUI(connectedAccount);

        }

    } catch (error) {

        console.error("Could not check wallet:", error);

    }

}

// Check wallet when website loads
checkWalletConnection();

// ACCOUNT CHANGED

if (window.ethereum) {

    window.ethereum.on("accountsChanged", (accounts) => {

        if (accounts.length === 0) {

            connectedAccount = null;

            setNavWalletDisconnected();

            setWalletState("disconnected");

            walletStatus.textContent = "";

            myCapsuleList.replaceChildren();
            capsulesCache = [];
            lastRenderSignature = null;
            myCapsuleStatus.textContent = "Connect your wallet to see your capsules.";

            console.log(
                "Wallet disconnected"
            );

        } else {

            connectedAccount = accounts[0];

            updateWalletUI(
                connectedAccount
            );

            console.log(
                "Wallet account changed:",
                connectedAccount
            );
        }
    });
}