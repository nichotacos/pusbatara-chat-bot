const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const userStates = {};  // This will store the state of each user and their form responses

const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startSock(); // Restart if not logged out
            }
        } else {
            console.log('Connection update:', update);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle user input and menu navigation
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];

        if (!msg.key.fromMe && msg.key.remoteJid.includes('@s.whatsapp.net') && msg.message) {
            const userId = msg.key.remoteJid;
            const userInput = msg.message.conversation.trim(); // User input
            const userState = userStates[userId] || { currentMenu: 'mainMenu', formData: {} };  // Get user's state, or set to mainMenu

            console.log('Message:', JSON.stringify(msg, null, 2));
            console.log('User input:', userInput);

            switch (userState.currentMenu) {
                case 'mainMenu':
                    await handleMainMenu(sock, userId, userInput, userState);
                    break;

                case 'donationMenu':
                    await handleDonationMenu(sock, userId, userInput, userState);
                    break;

                case 'fillForm':
                    await handleFormFilling(sock, userId, userInput, userState);
                    break;

                default:
                    await sock.sendMessage(userId, { text: 'Invalid menu state, resetting.' });
                    userState.currentMenu = 'mainMenu';
                    await sendMainMenu(sock, userId);
                    break;
            }

            userStates[userId] = userState;  // Save the updated state for the user
        }

        return;
    });
};

// Handle main menu logic
const handleMainMenu = async (sock, userId, input, userState) => {
    switch (input) {
        case '1':
            await sock.sendMessage(userId, {
                text: ' Latar Belakang, Visi, Misi, Tujuan, Nilai, dll. Link ke akun IG Pusbatara, Website, dll.'
            });
            await sendMainMenu(sock, userId);
            break;
        case '2':
            await sock.sendMessage(userId, {
                text: 'Rekap progress (textual) disertai link ke IG Pusbatara atau link YouTube'
            });
            await sendMainMenu(sock, userId);
            break;
        case '3':
            await sock.sendMessage(userId, {
                text: 'Pilih paket donasi yang anda inginkan:\n\n1. Tumbler Rp.###.###,00\n2. Bor Pile Rp.###.###,00\n3. Kapling Rp.###.###,00\n4. Donasi Bebas'
            });
            userState.currentMenu = 'donationMenu';  // Move to donation menu
            break;
        default:
            await sock.sendMessage(userId, { text: 'Invalid option. Please choose again.' });
            await sendMainMenu(sock, userId);
            break;
    }
};

// Handle donation menu logic
const handleDonationMenu = async (sock, userId, input, userState) => {
    let selectedPackageName, selectedPackagePrice;

    switch (input) {
        case '1':
            selectedPackageName = 'Tumbler';
            selectedPackagePrice = '###.###,00';
            break;
        case '2':
            selectedPackageName = 'Bor Pile';
            selectedPackagePrice = '###.###,00';
            break;
        case '3':
            selectedPackageName = 'Kapling';
            selectedPackagePrice = '###.###,00';
            break;
        case '4':
            selectedPackageName = 'Donasi Bebas';
            selectedPackagePrice = null;
            break;
        default:
            await sock.sendMessage(userId, {
                text: 'Paket donasi tidak ditemukan, silahkan pilih paket yang tersedia.'
            });
            return;
    }

    await sock.sendMessage(userId, {
        text: `Anda memilih paket donasi ${selectedPackageName} ${selectedPackagePrice && `seharga ${selectedPackagePrice}`}.`
    });

    // After selecting package, ask user for form input (Name, State, City)
    userState.currentMenu = 'fillForm';
    userState.formData.package = selectedPackageName;

    await sock.sendMessage(userId, {
        text: 'Please provide your details in the following format:\n\nName: <Your Name>\nState: <Your State>\nCity: <Your City>'
    });
};

// Handle form filling with one response
const handleFormFilling = async (sock, userId, input, userState) => {
    const formData = userState.formData;

    // Parsing user input to extract Name, State, and City
    const formRegex = /Name:\s*(?<name>.+)\nState:\s*(?<state>.+)\nCity:\s*(?<city>.+)/i;
    const match = formRegex.exec(input);

    if (match && match.groups) {
        formData.name = match.groups.name.trim();
        formData.state = match.groups.state.trim();
        formData.city = match.groups.city.trim();

        // Form is complete, send a summary
        await sock.sendMessage(userId, {
            text: `Thank you ${formData.name} from ${formData.city}, ${formData.state} for selecting the ${formData.package} package!`
        });

        // Reset user state to main menu after form completion
        userState.currentMenu = 'mainMenu';
        userState.formData = {};
        await sendMainMenu(sock, userId);
    } else {
        // If the format is incorrect, prompt the user again
        await sock.sendMessage(userId, {
            text: 'Invalid format. Please provide your details in the correct format:\n\nName: <Your Name>\nState: <Your State>\nCity: <Your City>'
        });
    }
};

// Send the main menu to users
const sendMainMenu = async (sock, userId) => {
    await sock.sendMessage(userId, {
        text: 'Selamat datang di menu utama. Pilih opsi:\n1. Profil Pusbatara\n2. Update Progress Pusbatara Terkini\n3. Ingin Berdonasi\n4. Konfirmasi Transfer\n5. Cek Outstanding/Riwayat Cicilan\n6. Live Chat Admin'
    });
};

// Start the socket connection
startSock();
