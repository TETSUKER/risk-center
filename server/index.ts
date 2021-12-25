import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import postgres from './pg';
import cors from 'cors';

const app = express();

type post = 'createUser' | 'createTransaction' | 'changeRiskParametres' | 'getTable';

app.use(bodyParser.json());

app.use(function (_req: Request, res: Response, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next();
});

app.use(cors());

app.get('/get', (req: Request, res: Response) => {
    postgres.getTable(req, res);
});

app.post('/post', (req: Request, res: Response) => {
    const post: post = req.body.action;
    postgres[post](req, res);
});

app.listen(8080, function() {
    console.log('Server is running.. on Port 8080');
});
