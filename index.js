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
  "private_key_id": "1b15765cdd41bc85eab3050b7c9f07cae4dcb616",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDLf9LSzRW3mICi\nDcTf+1ecf+fxpncg2I1QTWY2jLYr0DQZezUIT6Rx3M0FUTL10iR0a3dAD1/ckJ2D\nqNWCjZfwCy0z0zVujJ6ouFaqxZBQU6aPSXjE6/XaPL245KTCEUOr9RufMwa9mWzH\nZPAqd2mKFG8Jw4NsQxDyDsRVudTJsZPnKqNE1KM4OxllWulfcpkMF1qruS5bwo+s\nO2JbJb6WAjsXgSaicjEzGp6SmGR6CQSoFcH8xvHP70N0tNUtugR5+7UoUGjswf5d\niD6g04a2fa0WoEtQzyqtPiQGCl9HpZP2vpL9r0NAurTEHdXdZtD80NeZr+GhdoM1\nXBVx6h1vAgMBAAECggEAMy4ONUMsE5UwwNEKszRQ6ATJLl7p9iJQhCI7Mzv3cxR1\njfUNNO5m0tYv4Ab4dJep4HfIsZ1MRDpAy0SSkjePP2loMHENrqSCILff4Co47eLj\n8ISPcaNQnVcKdi5W+5IA/YXzMPpR1yx3jbxmpJ+MtRQHiyKXcop5gA9TtKW8jQ7/\nvIfLde3T6H3VmU/qo+Fh2gHajnOexrHA+u/VJUkYDNFvcZ9z/z+kDRLUjZefO9J+\nn6pU0ZNKfRxUTOx6KDtWUIz2nfjxvfZ8D4tPRM1NMDMPM8Nt/8bu5mtaugMlfaww\nUVETuGgeI9IBrgAD+ecVvj7PfoP/wOvX5WxpY8fvDQKBgQDyC37GDU3w+24+hY6g\ncPU8EihwkvQadijPZf6TzONRN5lSDjBN3uZWZL6FoL/5yp4Ki5faiAsEgxk306dw\naVGrw1vM4AQuLouKd3aIz7OfcWoiRYTP/Jd9DPp7KFhuyCxKGmf+1/OHVzWWKnPi\nGt7SdlYk0/yhaotSj80i4vCdbQKBgQDXO2hlF4LQ3GRDfDV/McmykKYh27pRi3Zc\nC7uZFhRu0IlSG193yAByKoyvqDMP32g0l9g8fjrfqjcOrVlbh8mqvtIuPOOLAQ6r\nCRhSY7QHVbjuqiTrwF2As/5HEL/fCw+8WhtvBu3KrwiMUsRJUysk2C68uRSzKFVA\nJKQgtS1oywKBgQCbr30pkuExQehVWr60wDNdIijU0BEm/B2f2XD4TG9ijCqYNvwm\n+lqZ808A0LbqysMA8W0JaTv8+P49hGxMx9F6c7wWeXj244Vp2RFrSn207tRfmuuk\nhEpEaxaqJPdMuoCSYY3Gw8ymnxeesUu8gaAVK3yZT6lNgiR/RHOkHui5uQKBgQCV\nlREhqOxekb0Q9cMMSiLeeg8r2tSrlZxFrlXLt/+tYDr/mEyKJ7K/pXivH9uU/XQj\nkSBUMnpiNZ8cETfYGA/9Ha9fOSv+0FZMYf7IS8izjE0Bebg9LC0PpIhlBWwD7GEc\nSxdj21HqGil7tI38U9PZQHGC8bJELRTKhmyW2rPbbwKBgBWDChxmivZnDAWOzNO3\naI2jrrjnRrKyP1+OSjoKuXVCdIWXFecysNxwHnH1ESBXXV31d3AXv4Tu5rK8bxTb\ndnXf5L4RPA0rrz3D9NiV1mMczBLRrKIn0FL0oJbf+Dv38hWsJIhbd4ZJ9i2zw1/a\n6VD66rU+UIYwt5i6vjB7BCpE\n-----END PRIVATE KEY-----\n",
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


app.get('/', (req, res) => {
    res.json({ "Message": "Server is running" });
});


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
