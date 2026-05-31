/*
 * Integracijski testovi HTTP ruta koji NE diraju bazu — provjeravaju
 * usmjeravanje, autentikaciju i validacijski sloj (odgovori prije DB upita).
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './index';

describe('GET /api/health', () => {
  it('vraća status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/auth/register — validacija', () => {
  it('odbija prazno tijelo (ime obavezno)', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Ime je obavezno.');
  });

  it('odbija neispravan email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ime: 'Ivan', email: 'neispravno', password: 'tajna123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Neispravna email adresa.');
  });

  it('odbija prekratku lozinku', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ime: 'Ivan', email: 'ivan@primjer.hr', password: 'kratko' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Lozinka mora imati najmanje 8 znakova.');
  });
});

describe('POST /api/auth/login — validacija', () => {
  it('odbija prazno tijelo', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email i lozinka su obavezni.');
  });
});

describe('zaštićene rute', () => {
  it('GET /api/users bez tokena vraća 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});
