const { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const mongoose = require('mongoose');
const cloudinary = require('./utils/cloudinary');
const express = require('express');
const cors = require('cors');

require('dotenv').config();

const userStates = {};  // This will store the state of each user and their form responses

const app = express();
app.use(cors());

app.use(express.json());

// Routes
const donatorRoutes = require('./routes/donatorRoutes');
const packageRoutes = require('./routes/packageRoutes');

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
                startSock();
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
            const userInput = msg.message.extendedTextMessage?.text?.trim() || msg.message?.conversation;
            const userState = userStates[userId] || { currentMenu: 'initial', formData: {}, step: 0 };  // Get user's state, or set to mainMenu

            console.log('Message:', JSON.stringify(msg, null, 2));
            console.log('User input:', userInput);
            console.log('User state:', userState);

            if (userState.step > 0 && userState.currentMenu === 'mainMenu') {
                userState.currentMenu = 'initial';
                userState.step = 0;
            }
            if (userState.step > 0 && userState.currentMenu != 'mainMenu') {
                await sendMainMenu(sock, userId);
                userState.currentMenu = 'mainMenu';
                userState.step = 0;
                return;
            }

            switch (userState.currentMenu) {
                case 'initial':
                    await tesSwitch(sock, userId, userInput, userState);
                    userStates[userId] = userState;
                    return;
                case 'mainMenu':
                    await handleMainMenu(sock, userId, userInput, userState);
                    break;
                case 'donationMenu':
                    await handleDonationMenu(sock, userId, userInput, userState);
                    break;
                case 'chooseInstallment':
                    // choose installment type
                    await handleInstallmentType(sock, userId, userInput, userState);
                    break;
                case 'fillForm':
                    await handleFormFilling(sock, userId, userInput, userState);
                    break;
                case 'sendConfirmation':
                    // give function to handle image input
                    await handleImageInput(sock, userId, msg, userState);
                    break;
                // default:
                //     await sock.sendMessage(userId, { text: 'Invalid menu state, resetting.' });
                //     userState.currentMenu = 'mainMenu';
                //     await sendMainMenu(sock, userId);
                //     break;
            }

            userStates[userId] = userState;  // Save the updated state for the user
        }

        return;
    });
};

const tesSwitch = async (sock, userId, userInput, userState) => {
    if (['halo', 'menu', 'tanya', 'p'].includes(userInput.toLowerCase())) {
        await handleInitialMenu(sock, userId, userState);
    } else {
        userState.currentMenu = 'initial'; // Default to 'initial' if no match
    }
}

const handleInitialMenu = async (sock, userId, userState) => {
    await sock.sendMessage(userId, {
        text: 'Selamat datang di menu utama. Pilih opsi:\n1. Profil Pusbatara\n2. Update Progress Pusbatara Terkini\n3. Ingin Berdonasi\n4. Konfirmasi Transfer\n5. Cek Outstanding/Riwayat Cicilan\n6. Live Chat Admin'
    });
    userState.currentMenu = 'mainMenu';
}

const upStep = function (userState) {
    userState.step++;
    return userState;
}

const downStep = function (userState) {
    userState.step == 0 ? userState.step : userState.step--;
    return userState;
}

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
                text: 'Pilih paket donasi yang anda inginkan:\n\n1. Tumbler Rp.###.###,00\n2. Bor Pile Rp.###.###,00\n3. Kapling Rp.###.###,00\n4. Donasi Bebas\n\n0. Kembali ke menu utama.'
            });
            downStep(userState);
            userState.currentMenu = 'donationMenu';  // Move to donation menu
            break;
        case '4':
            await sock.sendMessage(userId, {
                text: 'Konfirmasi transfer ke rekening BCA 1234567890 atas nama Pusbatara. Unggah gambar bukti transfer yang telah dilakukan.'
            });
            userState.currentMenu = 'sendConfirmation';  // Move to send confirmation menu
            break;
        case '5':
            await sock.sendMessage(userId, {
                text: 'Cek outstanding/cicilan dengan nomor HP yang terdaftar.'
            });
            await sendMainMenu(sock, userId);
            break;
        case '6':
            await sock.sendMessage(userId, {
                text: 'Live chat dengan admin Pusbatara. Silahkan mengetik pesan anda.'
            });
            await sendMainMenu(sock, userId);
            break;
        default:
            upStep(userState);
            await sock.sendMessage(userId, { text: 'Pilihan tidak tersedia. Harap masukkan pilihan yang tersedia!' });
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
        case '0':
            await sock.sendMessage(userId, {
                text: 'Kembali ke menu utama.'
            });
            await sendMainMenu(sock, userId);
            userState.currentMenu = 'mainMenu';
            return;
        default:
            upStep(userState);
            await sock.sendMessage(userId, {
                text: 'Paket donasi tidak ditemukan, silahkan pilih paket yang tersedia.'
            });
            userStates[userId] = userState;
            return;
    }

    await sock.sendMessage(userId, {
        text: `Anda memilih paket donasi ${selectedPackageName} ${selectedPackagePrice && `seharga ${selectedPackagePrice}`}.`
    });

    if (input === '4') {
        await sock.sendMessage(userId, {
            text: 'Isilah data diri anda menggunakan format berikut. Dapat disalin saja dan isi sesuai kolom yang dibutuhkan. Pastikan data yang anda isi benar:\n\nNama: \nProvinsi: \nKota: '
        });
    } else {
        if (input === '3') {
            await sock.sendMessage(userId, {
                text: 'Pilih tipe donasi yang anda inginkan:\n\n1. Sekali Bayar\n2. 10 Kali Cicilan'
            });
        } else {
            await sock.sendMessage(userId, {
                text: 'Pilih tipe donasi yang anda inginkan:\n\n1. Sekali Bayar\n2. 5 Kali Cicilan'
            });
        }
    }

    // Redirecting to choose installment type
    userState.currentMenu = 'chooseInstallment';
    userState.formData.package = selectedPackageName;
};

const handleInstallmentType = async (sock, userId, input, userState) => {
    let installmentType;

    // /Tumbler|Bor Pile/
    if (userState.formData.package.includes(['Tumbler', 'Bor Pile'])) {
        if (input === '1') {
            installmentType = 'Sekali Bayar';
            downStep(userState);
        } else if (input === '2') {
            installmentType = '5 Kali Cicilan';
            downStep(userState);
        } else {
            upStep(userState);
            await sock.sendMessage(userId, {
                text: 'Silahkan pilih cicilan yang tersedia.'
            });
            return;
        }
    } else {
        if (input === '1') {
            installmentType = 'Sekali Bayar';
            downStep(userState);
        } else if (input === '2') {
            installmentType = '10 Kali Cicilan';
            downStep(userState);
        } else {
            upStep(userState);
            await sock.sendMessage(userId, {
                text: 'Silahkan pilih cicilan yang tersedia.'
            });
            return;
        }
    }

    await sock.sendMessage(userId, {
        text: `Anda memilih tipe donasi ${userState.formData.package} dengan pembayaran ${installmentType}. Terima kasih atas donasi yang telah diberikan.`
    });

    // After selecting package, ask user for form input (Name, State, City)
    userState.currentMenu = 'fillForm';
    userState.formData.installmentType = installmentType;
}

// Handle form filling with one response
const handleFormFilling = async (sock, userId, input, userState) => {
    const formData = userState.formData;

    // Parsing user input to extract Name, State, and City
    const formRegex = /Nama:\s*(?<name>.+)\nProvinsi:\s*(?<state>.+)\nKota:\s*(?<city>.+)/i;
    const match = formRegex.exec(input);

    if (match && match.groups) {
        formData.name = match.groups.name.trim();
        formData.state = match.groups.state.trim();
        formData.city = match.groups.city.trim();

        // Form is complete, send a summary
        await sock.sendMessage(userId, {
            text: `Terima kasih ${formData.name} atas donasi yang telah dilakukan\n\nAnda dapat melakukan transfer ke rekening BCA 1234567890 atas nama Pusbatara. Kemudian sertakan bukti transfer pada menu ke-4 (Konfirmasi Transfer).`
        })

        // Reset user state to main menu after form completion
        userState.currentMenu = 'mainMenu';
        userState.formData = {};
        await sendMainMenu(sock, userId);
    } else {
        // If the format is incorrect, prompt the user again
        await sock.sendMessage(userId, {
            text: 'Format data diri tidak tepat. Harap inputkan data diri sesuai dengan format yang diberikan:\n\nNama: \nProvinsi: \nKota: '
        });
    }
};

// Handle image input for transfer confirmation
const handleImageInput = async (sock, userId, input, userState) => {
    // Handle image input here
    if (input.message.imageMessage) {
        const imageBuffer = await downloadMediaMessage(
            input,
            'buffer',
            {},
            { logger: console }
        );
        console.log(imageBuffer);
        const image = cloudinary.uploader.upload_stream({
            resource_type: 'image',
        }, async (error) => {
            if (error) {
                await sock.sendMessage(userId, {
                    text: 'Terjadi kesalahan saat mengunggah gambar. Silahkan coba lagi.'
                });
                console.error(error);
                return;
            } else {
                await sock.sendMessage(userId, {
                    text: `Terima kasih atas konfirmasi transfer. Bukti transfer anda: ${image.secure_url}`
                });
                userState.currentMenu = 'mainMenu';
                return;
            }
        }).end(imageBuffer);
    } else {
        await sock.sendMessage(userId, {
            text: 'Silahkan kirimkan gambar bukti transfer.'
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
// startSock();

mongoose
    .connect(
        process.env.MONGO_URI
    ).then(result => {
        console.log('Connected to MongoDB ' + result.connection.db.databaseName);
        app.listen(8080);
    }).catch(err => {
        console.log(err);
    });


app.use('/donators', donatorRoutes);
app.use('/packages', packageRoutes);