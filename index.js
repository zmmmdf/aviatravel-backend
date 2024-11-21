const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // Replace with the path to your Firebase Admin SDK key file
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

    // Define the categories to fetch when "all" is requested
    const allCategories = [
        'general-news',
        'travel-azerbaijan',
        'travel-world',
        'go-shoot-share',
        'hot-offers',
    ];

    try {
        if (category === "all") {
            // Fetch posts from all categories
            const promises = allCategories.map(cat =>
                database.ref(`/${cat}`).once('value')
            );

            const snapshots = await Promise.all(promises);
            const allPosts = snapshots.flatMap((snapshot, index) => {
                const data = snapshot.val();
                if (!data) return []; // Skip empty categories

                return Object.keys(data).map(key => ({
                    id: key,
                    category: allCategories[index], // Include category for better filtering if needed
                    ...data[key],
                }));
            });

            return res.status(200).json(allPosts);
        } else {
            // Fetch posts from a single category
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
        // Reference to the specific category and ID in the Firebase database
        const itemRef = database.ref(`${category}/${id}`);

        // Retrieve the data from Firebase
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

app.get('/get_stats', async (req, res) => {

    try {
        // Reference to the specific category and ID in the Firebase database
        const itemRef = database.ref(`statistics`);

        // Retrieve the data from Firebase
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


app.post('/new_post', upload.array('images[]', 10), async (req, res) => {
    console.log('Received request to create a post');
    try {
        const { title, subtitle, description, content, author, category, additional_categories } = req.body;
        const files = req.files;

        if (!title || !subtitle || !content || !author) {
            return res.status(400).json({ error: 'Missing required fields: title, subtitle, content, or author' });
        }

        // Handle uploaded images
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

            images = fileUrls; // Assign uploaded file URLs to images array
        }

        // Reference to the Firebase Database
        const dataRef = database.ref(`${category}`);
        const dataRefData = database.ref(`statistics`);

        // Increment total_news and active_news safely
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
        

        // Generate unique post ID
        const postId = uuidv4();

        // Prepare post data
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

        // Add the post data to Firebase
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

        // Reference to the specific news item in Firebase
        const itemRef = database.ref(`${category}/${id}`);

        // Check if the news item exists
        const snapshot = await itemRef.once('value');
        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'News item not found' });
        }

        // Delete the news item from Firebase
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
        // Reference to the specific category and ID in Firebase
        const itemRef = database.ref(`${category}/${id}`);

        // Retrieve the existing data from Firebase
        const snapshot = await itemRef.once('value');
        const existingData = snapshot.val();

        if (!existingData) {
            return res.status(404).json({ error: 'News item not found' });
        }

        // Handle uploaded images
        let images = existingData.images || []; // Keep existing images if no new ones are uploaded
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

            // Add newly uploaded images to the existing images array
            images = [...images, ...fileUrls];
        }

        // Prepare updated post data
        const updatedData = {
            title,
            subtitle,
            description: description || existingData.description, // Keep existing description if not provided
            content,
            author,
            category: category || existingData.category,
            additional_categories: additional_categories ? additional_categories : existingData.additional_categories,
            images, // Updated image URLs
            timestamp: new Intl.DateTimeFormat('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(new Date()),
            status: existingData.status, // Retain the status of the post
        };

        // Update the post data in Firebase
        await itemRef.update(updatedData);

        console.log(`Post with ID: ${id} updated successfully!`);
        return res.status(200).json({ message: "Post updated successfully", id });
    } catch (error) {
        console.error(`Error updating post with ID: ${id} in category: ${category}:`, error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});
app.put('/update_headline/:index/', async (req, res) => {
    const { index } = req.params;
    const { id, category } = req.body;
    try {
        const itemRef = database.ref(`headlines/${index}`);

        const updatedData = {
            category,
            id
        };

        await itemRef.update(updatedData);

        console.log(`Headline with index: ${index} updated successfully!`);
        return res.status(200).json({
            message: "Headline updated successfully",
            updatedData
        });
    } catch (error) {
        console.error(`Error updating headline with index: ${index} into category: ${category}:`, error);
        return res.status(500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
});


app.delete('/delete_image/:category/:id/:image_url', async (req, res) => {
    const { category, id, image_url } = req.params;

    try {
        console.log(`Received request to delete image from news item with ID: ${id} in category: ${category}`);

        // Reference to the specific news item in Firebase
        const itemRef = database.ref(`${category}/${id}`);

        // Retrieve the existing data from Firebase
        const snapshot = await itemRef.once('value');
        const existingData = snapshot.val();

        if (!existingData) {
            return res.status(404).json({ error: 'News item not found' });
        }

        // Check if the image URL exists in the data
        const imageIndex = existingData.images.indexOf(image_url);
        if (imageIndex === -1) {
            return res.status(404).json({ error: 'Image URL not found in news item' });
        }

        // Remove the image URL from the database
        existingData.images.splice(imageIndex, 1);

        // Update the news item in Firebase Database
        await itemRef.update({ images: existingData.images });

        // Delete the image file from Firebase Storage
        const fileName = image_url.split('/').pop(); // Extract the file name from the URL
        const file = bucket.file(fileName);

        await file.delete(); // Delete the file from Firebase Storage

        console.log(`Image deleted successfully from Firebase Storage and Database.`);
        return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error(`Error deleting image from Firebase Storage and Database:`, error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    
    console.log(`Server running on port ${PORT}`);
});
