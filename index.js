const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const serviceAccount = {
  "type": "service_account",
  "project_id": "aviatravel-az",
  "private_key_id": "3683e75a9765ef0442b01e88eb757d8d8453027b",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDB8yjZvpyyxcY1\nrCAPeQ7jBA+DhdkLu5JN/CwhuYdsqSscgw2Y0yrImgqZl5lzqwYkiJQqioXR5f1P\nIB8KlRKmeP0MKuluhlxIRo/rTdJobr0Cw6GJfKwo3t7dVRG1Zmeef8vdLNzh7bWH\nhadjZm57G34VxsYJexSX4+hUpXKbo6FDs53J24OpDwi0kL+t20hSBJ3IidNpmFL6\n+temv0wbIAV59RqUrSzfBrpWCIBBOjddZnCjFKskZrKgbO1cdkSkzY1T8E5dI+72\nGc/UnSo/tBwLYZYPoq0NEMoZnrNpCawy1EZf+zONTHjL5F6y7AnBVdQJgaR06MLu\nI439354zAgMBAAECggEARexP+Hy/irZB2PzWzC1FYDQJEc5SK2gy/XmiQYBdYh/1\nQoC/CK9s98iNdMVSlgB9JPO2k0XArCViN0Ip3stS34C0HkxkPywing4OefNjHbJ6\n40G7fdFcUhnTuHEggslKJzsEuRchBTUJorPdXrlBsJF/WgOBR06/5GjOzKGfWZu6\nWtyBCm+NpdiS+6um1S/UUh4bxkic8W++JK5NZzpdkNsmBP+xzjNGeJUqKTv7aJQ6\nygIhuaf9kCBcjq9nGZfZaI4/6SQ48yDd5BakmoS0YjmlvMEG3G6tO/Rpn/j+nu27\nVWsr5EXb2zVjJ5jdLnJUynw+bgXGmk/rzAQIPiaRdQKBgQDl+LuNfXQ6FACU5grQ\nRT7mvwB00To3iwolzRkVjAayNufaVWSnnNSRVjrlztG0+JyiBYQXb9ddBMCkBJ7f\njv+LTqIMKa3hjYvECUXm2Ff4LQXva5boilerGAUcLnXNdiYtiupT9X2ogslD9reC\nWpjlLwRdf0lZOyxvVowWsyzB1wKBgQDX5rijOvKRe7ji2au3Wdi97lPbV1Bw0Q2c\nB/44bQOfrigc1tleoHvnIs0RcVTgHOrMmpFo4sh4hkQkBIpM9XjQqNwTI3bvYK+F\nnlnIgDgN02eUkxtPNDMEfFgQZy3rTrRhznmXfv9+pTGAnJh1W0hVIT134Wv8SDBm\nHtKz324zBQKBgQDFe0DjkbW7Ie4V7y2eB7iqQZ7MsdcCV12RdHxz6ljdtRSIgwf6\nf0xyuc++BEpE07D92SrDTYFtGWWr82PSqmN7Zzz0oN32cKxy3VuvjlyMe207WfKv\nIg2CmQ/aUXNLyoeiWEY9bvRHPnhC6pxPTik5tZRUDbgY7h2MRo/p9lca5QKBgQCu\nveOE4aoATAXZPVn5HTQKjYG7jpDhrqH4PpPosXr0W63FobLvHq8J5SXaz0Jl3aHA\nlf3IyXx96BXwnOge37K4F2N/7f1OQ4/scryyReyYbBlyrBm3YkVEhSt1oz0MLXhb\njRTmo/hAVY2aTaQroAUMOcoZZA7VcswRazMYOGdlzQKBgH/DGYoYUb6AY7Ay0+LM\nuUsy5gMmOv9FEtVXkNJPt/fuV1F3LWHeLV41DNGg5d6cMTweoM/4LdyT0uMXC7k8\ncLqpqExMWxBByJH+61hoz/tm8M+u6op2QRFAiiXb2klk7vkhIKfhZGSKyEzQ+K96\nNALRZ79GS0oQn86RlqciMROD\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-4esmh@aviatravel-az.iam.gserviceaccount.com",
  "client_id": "111616933634326200002",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-4esmh%40aviatravel-az.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://aviatravel-az-default-rtdb.firebaseio.com",
    storageBucket: "aviatravel-az.firebasestorage.app",
});

const database = admin.database(); // Use Admin SDK's database
const bucket = admin.storage().bucket();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route to get posts from a specific category
app.get('/get_news/:category', async (req, res) => {
    const { category } = req.params;
    console.log(`Received request to fetch posts from category: ${category}`);

    const allCategories = [
        'general-news',
        'travel-azerbaijan',
        'travel-world',
        'go-shoot-share',
        'hot-offers',
    ];

    try {
        if (category === "all") {
            const promises = allCategories.map(cat =>
                database.ref(`/${cat}`).once('value')
            );

            const snapshots = await Promise.all(promises);
            const allPosts = snapshots.flatMap((snapshot, index) => {
                const data = snapshot.val();
                if (!data) return [];

                return Object.keys(data).map(key => ({
                    id: key,
                    category: allCategories[index],
                    ...data[key],
                }));
            });

            return res.status(200).json(allPosts);
        } else {
            const categoryRef = database.ref(`/${category}`);
            categoryRef.once('value', (snapshot) => {
                const data = snapshot.val();

                if (!data) {
                    return res.status(404).json({ message: `No posts found in category: ${category}` });
                }

                const posts = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                }));

                return res.status(200).json(posts);
            });
        }
    } catch (error) {
        console.error(`Error fetching posts for category "${category}":`, error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Fetch news by category and ID
app.get('/get_news/:category/:id', async (req, res) => {
    const { category, id } = req.params;

    try {
        const itemRef = database.ref(`${category}/${id}`);
        const snapshot = await itemRef.once('value');
        const data = snapshot.val();

        if (data) {
            return res.status(200).json(data);
        } else {
            return res.status(404).json({ error: 'News item not found' });
        }
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Route for statistics
app.get('/get_stats', async (req, res) => {
    try {
        const itemRef = database.ref(`statistics`);
        const snapshot = await itemRef.once('value');
        const data = snapshot.val();

        if (data) {
            return res.status(200).json(data);
        } else {
            return res.status(404).json({ error: 'Statistics item not found' });
        }
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Route for headlines
app.get('/get_headlines', async (req, res) => {
    try {
        const itemRef = database.ref(`headlines`);
        const snapshot = await itemRef.once('value');
        const data = snapshot.val();

        if (data) {
            return res.status(200).json(data);
        } else {
            return res.status(404).json({ error: 'Headlines item not found' });
        }
    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Create a new post with images
app.post('/new_post', upload.array('images[]', 10), async (req, res) => {
    console.log('Received request to create a post');
    try {
        const { title, subtitle, description, content, author, category, additional_categories } = req.body;
        const files = req.files;

        if (!title || !subtitle || !content || !author) {
            return res.status(400).json({ error: 'Missing required fields: title, subtitle, content, or author' });
        }

        let images = [];
        if (files && files.length > 0) {
            const fileUrls = [];

            for (const file of files) {
                const uniqueFileName = `${uuidv4()}_${file.originalname}`;
                const blob = bucket.file(uniqueFileName);
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                    },
                });

                await new Promise((resolve, reject) => {
                    blobStream.on('error', reject);

                    blobStream.on('finish', async () => {
                        await blob.makePublic();
                        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
                        fileUrls.push(publicUrl);
                        resolve();
                    });

                    blobStream.end(file.buffer);
                });
            }

            images = fileUrls;
        }

        const dataRef = database.ref(`${category}`);
        const dataRefData = database.ref(`statistics`);

        await dataRefData.child("total_news").get().then(snapshot => {
            if (snapshot.exists()) {
                const currentTotalNews = snapshot.val();
                dataRefData.child("total_news").set(currentTotalNews + 1);
            } else {
                dataRefData.child("total_news").set(1); 
            }
        });

        await dataRefData.child("active_news").get().then(snapshot => {
            if (snapshot.exists()) {
                const currentActiveNews = snapshot.val();
                dataRefData.child("active_news").set(currentActiveNews + 1);
            } else {
                dataRefData.child("active_news").set(1);
            }
        });

        const postId = uuidv4();

        const postData = {
            id: postId,
            title,
            subtitle,
            description: description || null,
            content,
            author,
            category: category || null,
            additional_categories: additional_categories ? additional_categories : [],
            images,
            timestamp: new Intl.DateTimeFormat('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(new Date()),
            status: true,
        };

        await dataRef.child(postId).set(postData);

        console.log("Data and images pushed successfully!");
        return res.status(201).json({ message: "Post created successfully", postId });
    } catch (error) {
        console.error("Error pushing data to Firebase:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Delete news by category and ID
app.delete('/delete_news/:category/:id', async (req, res) => {
    const { category, id } = req.params;

    try {
        console.log(`Received request to delete news item with ID: ${id} in category: ${category}`);

        const itemRef = database.ref(`${category}/${id}`);

        const snapshot = await itemRef.once('value');
        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'News item not found' });
        }

        await itemRef.remove();

        console.log(`News item with ID: ${id} in category: ${category} deleted successfully.`);
        return res.status(200).json({ message: 'News item deleted successfully' });
    } catch (error) {
        console.error(`Error deleting news item with ID: ${id} in category: ${category}:`, error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Update news by category and ID
app.put('/update_post/:category/:id', upload.array('images[]', 10), async (req, res) => {
    const { category, id } = req.params;
    const { title, subtitle, description, content, author, additional_categories } = req.body;
    const files = req.files;

    if (!title || !subtitle || !content || !author) {
        return res.status(400).json({ error: 'Missing required fields: title, subtitle, content, or author' });
    }

    try {
        const itemRef = database.ref(`${category}/${id}`);
        const snapshot = await itemRef.once('value');
        const existingData = snapshot.val();

        if (!existingData) {
            return res.status(404).json({ error: 'News item not found' });
        }

        let images = existingData.images || [];

        if (files && files.length > 0) {
            const fileUrls = [];

            for (const file of files) {
                const uniqueFileName = `${uuidv4()}_${file.originalname}`;
                const blob = bucket.file(uniqueFileName);
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                    },
                });

                await new Promise((resolve, reject) => {
                    blobStream.on('error', reject);

                    blobStream.on('finish', async () => {
                        await blob.makePublic();
                        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
                        fileUrls.push(publicUrl);
                        resolve();
                    });

                    blobStream.end(file.buffer);
                });
            }

            images = [...images, ...fileUrls];
        }

        const updatedPostData = {
            ...existingData,
            title,
            subtitle,
            description: description || null,
            content,
            author,
            additional_categories: additional_categories || [],
            images,
            timestamp: new Intl.DateTimeFormat('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(new Date()),
        };

        await itemRef.update(updatedPostData);

        console.log(`Post with ID: ${id} in category: ${category} updated successfully.`);
        return res.status(200).json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error(`Error updating post with ID: ${id} in category: ${category}:`, error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
