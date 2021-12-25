import { Request, Response } from 'express';
import { Client } from 'pg';

const connectionString = "postgres://postgres:1234@localhost:5432/risk_center";
const client = new Client({
    connectionString: connectionString
});

client.connect();

let riskParameters = {
    maxPass: 5,
    minAge: 18,
    riskCountry: 'Russia',
    maxSum: 150000,
    maxTransactions: 15
};

function getRiskParametres() {
    const select = 'SELECT * FROM riskcenter;';
    client
        .query(select)
        .then(result => {
            riskParameters.maxPass = result.rows[0].max_pass;
            riskParameters.minAge = result.rows[0].min_age;
            riskParameters.riskCountry = result.rows[0].risk_country;
            riskParameters.maxSum= result.rows[0].max_sum;
            riskParameters.maxTransactions = result.rows[0].max_transactions;
        })
        .catch(err => console.error(err.stack));
};
getRiskParametres();

async function getUserId(username: string) {
    const select = 'SELECT user_id FROM users WHERE username=$1';
    try {
        return (await client.query(select, [username])).rows[0].user_id;
    } catch(err) {
        return err.stack;
    }
}

async function getUserAge(userid: number) {
    const select = 'SELECT userage FROM users WHERE user_id=$1';
    try {
        return (await client.query(select, [userid])).rows[0].userage;
    } catch(err) {
        return err.stack;
    }
}

async function getUserCountry(userid: number) {
    const select = 'SELECT country FROM users WHERE user_id=$1';
    try {
        return (await client.query(select, [userid])).rows[0].country;
    } catch(err) {
        return err.stack;
    }
}

async function getUserPassword(userid: number) {
    const select = 'SELECT password FROM users WHERE user_id=$1';
    try {
        return (await client.query(select, [userid])).rows[0].password;
    } catch(err) {
        return err.stack;
    }
}

async function getUserPassAttemps(userid: number) {
    const select = 'SELECT * FROM risklog WHERE user_id=$1 AND risk_type=WRONG_PASS';
    try {
        return (await client.query(select, [userid])).rows.length;
    } catch(err) {
        return err.stack;
    }
}

async function getUserTransactions(userid: number) {
    const select = 'SELECT * FROM transactions WHERE user_id=$1;';
    try {
        return (await client.query(select, [userid])).rows.length;
    } catch(err) {
        return err.stack;
    }
}

function createRiskLog(userId: number, riskType: string, time: Date) {
    const insert = 'INSERT INTO risklog (user_id, risk_type, time) VALUES ($1, $2, $3)';
    const values = [userId, riskType, time]
    client
        .query(insert, values)
        .then(() => console.log('Risklog added to db'))
        .catch(err => console.error(err.stack));
}

const createUser = (req: Request, res: Response) => {
    const select = 'SELECT * FROM users WHERE username=$1';
    const insert = 'INSERT INTO users (username, password, userage, country) VALUES ($1, $2, $3, $4);'
    const values = [req.body.name, req.body.password, req.body.age, req.body.country];
    client
        .query(select, [req.body.name])
        .then(result => {
            if (result.rows.length > 0) {
                res.status(200).send('User with this name already exist');
            } else {
                client
                    .query(insert, values)
                    .then(() => res.status(200).send('User succesfully added'))
                    .catch(err => res.status(400).send(err));
            }
        })
        .catch(err => console.error(err.stack));
};

const createTransaction = async (req: Request, res: Response) => {
    const userId = await getUserId(req.body.name);
    const nowTime = new Date();
    if(req.body.password != await getUserPassword(userId)) {
        createRiskLog(userId, 'WRONG_PASS', nowTime);
        return res.status(200).send('Wrong password');
    }
    if(await getUserPassAttemps(userId) >= riskParameters.maxPass)
        createRiskLog(userId, 'MAX_PASS', nowTime);

    if(await getUserAge(userId) <= riskParameters.minAge)
        createRiskLog(userId, 'MIN_AGE', nowTime);

    if(await getUserCountry(userId) === riskParameters.riskCountry)
        createRiskLog(userId, 'RISK_COUNTRY', nowTime);

    if(req.body.cash >= riskParameters.maxSum)
        createRiskLog(userId, 'MAX_SUM', nowTime);

    if(await getUserTransactions(userId) >= riskParameters.maxTransactions)
        createRiskLog(userId, 'MAX_TS', nowTime);

    const insert = 'INSERT INTO transactions (user_id, time, sum) VALUES ($1, $2, $3);';
    const values = [userId, nowTime, req.body.cash];
    client
        .query(insert, values)
        .then(() => res.status(200).send('Transaction created!'))
        .catch(err => console.error(err.stack));
};

const changeRiskParametres = (req: Request, res: Response) => {
    console.log(req.body);
    const insert = 'UPDATE riskcenter SET max_pass = $1, min_age = $2, risk_country = $3, max_sum = $4, max_transactions = $5 WHERE id = 1;';
    const values = [req.body.maxPass, req.body.minAge, req.body.riskCountry, req.body.maxSum, req.body.maxTransactions];
    client
        .query(insert, values)
        .then(() => res.status(200).send('Parameters changed!'))
        .catch(err => console.error(err.stack));
};

const getTable = (req: Request, res: Response) => {
    const select = req.query.params === 'ALL' ?
        `SELECT * FROM ${req.query.table};` :
        `SELECT * FROM ${req.query.table} WHERE risk_type=$1;`;
    client
        .query(select, req.query.params === 'ALL' ? [] : [req.query.params])
        .then(result => res.status(200).send(result.rows))
        .catch(err => console.error(err.stack));
};

export default {createUser, createTransaction, changeRiskParametres, getTable};