import 'regenerator-runtime/runtime';
import axios from 'axios';

const Url = 'http://127.0.0.1:8080';
const options = {mode: 'cors', 'Cache-Control': 'no-cache'};

function selectorValue(selector) {
    return document.querySelector(selector).value
}

function post(data) {
    axios
        .post(Url + '/post', data, options)
        .then(function (data) {
            console.log(data);
        })
        .catch(err => console.error(err));
    getTables(['users', 'transactions', 'riskcenter', 'risklog']);
}

async function get(data) {
    try {
        return axios.get(Url + '/get', {params: data});
    } catch(err) {
        console.error(err);
    }
}

async function getRisks(data) {
    document.querySelector('.tables .table').innerHTML = '';
    if (!data.params) data.params =  document.querySelector('.tables select').value;
    const res = await get(data);
    let html = `<table><tr>`;
    for (const key in res.data[0]) {
        html += `\n<th>${key}</th>\n`;
    }
    html += `</tr>`;
    res.data.forEach(row => {
        html += `<tr>`;
        for (const key in row) {
            html += `\n<td>${row[key]}</td>\n`;
        }
        html += `</tr>`;
    });
    html += `</table>`;
    document.querySelector('.tables .table').insertAdjacentHTML('beforeend', html);
}

document.querySelector('.create-user button').addEventListener('click', () => {
    const data = {
        name: selectorValue('.create-user input[name=name]'),
        password: selectorValue('.create-user input[name=password]'),
        age: selectorValue('.create-user input[name=age]'),
        country: selectorValue('.create-user input[name=country]'),
        action: 'createUser'
    };

    post(data, '.create-user');
});

document.querySelector('.create-transaction button').addEventListener('click', () => {
    const data = {
        name: selectorValue('.create-transaction input[name=name]'),
        password: selectorValue('.create-transaction input[name=password]'),
        cash: selectorValue('.create-transaction input[name=cash]'),
        action: 'createTransaction'
    };

    post(data, '.create-transaction');
});

document.querySelector('.change-risk-parametres button').addEventListener('click', () => {
    const data = {
        maxPass: selectorValue('.change-risk-parametres input[name=max-pass]'),
        minAge: selectorValue('.change-risk-parametres input[name=min-age]'),
        riskCountry: selectorValue('.change-risk-parametres input[name=risk-country]'),
        maxSum: selectorValue('.change-risk-parametres input[name=max-sum]'),
        maxTransactions: selectorValue('.change-risk-parametres input[name=max-transactions]'),
        action: 'changeRiskParametres'
    };

    post(data, '.change-risk-parametres');
});

document.querySelector('.tables select').addEventListener('change', () => {
    const value = document.querySelector('.tables select').value;
    getRisks({table: 'risklog', params: value})
});

getRisks({table: 'risklog', params: 'ALL'});