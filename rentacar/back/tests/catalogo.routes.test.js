const request = require('supertest');
const express = require('express');

jest.mock('../src/models/Auto', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn()
}));

const Auto = require('../src/models/Auto');
const routes = require('../src/routes');

const app = express();
app.use(express.json());
app.use('/', routes);

const createAutoDoc = (detalles) => ({
  mostrarDetalles: jest.fn(() => detalles)
});

describe('RC-030 - Testing modulo catalogo', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('GET /api/catalogo debe devolver catalogo de autos', async () => {
    const autoDetalle = {
      id: 1,
      marca: 'Toyota',
      modelo: 'Corolla',
      precioDia: 50,
      disponible: true
    };

    const sortMock = jest.fn().mockResolvedValue([createAutoDoc(autoDetalle)]);
    Auto.find.mockReturnValue({ sort: sortMock });

    const response = await request(app).get('/api/catalogo');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([autoDetalle]);
    expect(Auto.find).toHaveBeenCalledWith({});
    expect(sortMock).toHaveBeenCalledWith({ marca: 1, modelo: 1 });
  });

  it('GET /api/catalogo debe aplicar filtros de consulta', async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    Auto.find.mockReturnValue({ sort: sortMock });

    const response = await request(app).get(
      '/api/catalogo?tipoCoche=SUV&marca=Toyota&disponible=true&combustible=Gasolina&transmision=Automatica&capacidad=5&precioMin=20&precioMax=100'
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Auto.find).toHaveBeenCalledWith({
      tipoCoche: 'SUV',
      marca: 'Toyota',
      disponible: true,
      combustible: 'Gasolina',
      transmision: 'Automatica',
      capacidad: 5,
      precioDia: {
        $gte: 20,
        $lte: 100
      }
    });
  });

  it('GET /api/catalogo/search debe buscar por texto y filtros', async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    Auto.find.mockReturnValue({ sort: sortMock });

    const response = await request(app).get('/api/catalogo/search?query=toy&disponible=false');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const filtro = Auto.find.mock.calls[0][0];
    expect(filtro.disponible).toBe(false);
    expect(filtro.$or).toHaveLength(3);
    expect(filtro.$or[0].marca.$regex).toBe('toy');
    expect(filtro.$or[0].marca.$options).toBe('i');
    expect(filtro.$or[1].modelo.$regex).toBe('toy');
    expect(filtro.$or[2].matricula.$regex).toBe('toy');
  });

  it('GET /api/catalogo/:id debe devolver 404 si no existe', async () => {
    Auto.findById.mockResolvedValue(null);

    const response = await request(app).get('/api/catalogo/661fd8a661fd8a661fd8a661');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Auto no encontrado');
  });

  it('GET /api/catalogo/:id debe devolver detalle del auto cuando existe', async () => {
    const autoDetalle = {
      id: 7,
      marca: 'Ford',
      modelo: 'Explorer',
      precioDia: 80,
      disponible: true
    };

    Auto.findById.mockResolvedValue(createAutoDoc(autoDetalle));

    const response = await request(app).get('/api/catalogo/661fd8a661fd8a661fd8a661');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(autoDetalle);
  });

  it('GET /api/catalogo debe responder 500 si falla la consulta', async () => {
    const sortMock = jest.fn().mockRejectedValue(new Error('fallo db'));
    Auto.find.mockReturnValue({ sort: sortMock });

    const response = await request(app).get('/api/catalogo');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Error al obtener los autos');
  });
});
