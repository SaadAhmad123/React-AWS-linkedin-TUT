import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path';

const uri = "mongodb+srv://testsaad:UE27vPa3aSdXGLsF@cluster0-q6jhn.mongodb.net/test?retryWrites=true&w=majority"
const app = express()
app.all('*', function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });
app.use(bodyParser.urlencoded({extended: true})); 
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/build')))

const withDB = async (operations, res) => {
    try{
        const client = await MongoClient.connect(uri, { useUnifiedTopology: true})
        const db = client.db('test')
        await operations(db, res)
        client.close()
    }catch (error){
        console.log(error)
        res.status(500).json({message : "Error connecting to db", errorString : error.toString(), errorJSON : error})
    }
}

app.get('/api/article/:name', async (req, res) => {
    const articleName = req.params.name
    withDB(async db => {
        const articleInfo = await db.collection('articles').findOne({name : articleName})
        res.status(200).json(articleInfo)
    }, res)
})


app.post('/api/article/:name/upvote', async (req,res) => {
    const articleName = req.params.name
    withDB(async db => {
        const articleInfo = await db.collection('articles').findOne({name : articleName})
        await db.collection('articles').updateOne(
            {name : articleName},
            {
                '$set' : {
                    upvote : articleInfo.upvote + 1
                }
            }
        )
        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName})
        res.status(200).json(updatedArticleInfo)
    }, res)
})

app.post('/api/article/:name/add-comment', async (req,res) => {
    const articleName = req.params.name
    withDB(async db => {
        const articleInfo = await db.collection('articles').findOne({name : articleName})
        await db.collection('articles').updateOne(
            {name : articleName},
            {
                '$set' : {
                    comments : articleInfo.comments.concat({
                        comment : req.body.comment,
                        username : req.body.username,
                    })
                }
            }
        )
        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName})
        res.status(200).json(updatedArticleInfo)
    }, res)
    
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})
app.listen(8000, () => console.log('Listening on port 8000'))