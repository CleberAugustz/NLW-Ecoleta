import { Request, Response} from 'express';
import knex from '../database/connection';

//criando pontos
class PointsController {
    async index(request: Request, response: Response){
        /// criando filtros -- query params
        const { city, uf, itens} = request.query;
        
        const parseItens = String(itens)
        .split(',')
        .map(item => Number(item.trim()));

        const points = await knex('points')
        .join('points_itens', 'points.id','=', 'points_itens.point_id')
        .whereIn('points_itens.item_id', parseItens)
        .where('city',String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*')
    
        const serializedPoints = points.map(point =>{
            return {
                ...point,
                image_url: `http://192.168.0.105:3333/uploads/${point.image}`,
            };
        });
    
        return response.json(serializedPoints);

        return response.json(points);

    }

    async show(request: Request, response: Response){
        const { id } = request.params;

        const point = await knex('points').where('id', id).first();
        if (!point){
            return response.status(400).json({ message: 'Point not found.'});
        }

        const serializedPoint = {
                ...point,
                image_url: `http://192.168.0.105:3333/uploads/${point.image}`,
        };
        /*
        select  * from itens
        join point_itens on itens.idd =point_itens.item_id
        where point_itens.poiint_id=id
        */
        const itens = await knex('itens')
        .join('points_itens', 'itens.id' , '=', 'points_itens.item_id')
        .where('points_itens.point_id', id)
        .select('itens.title');

        return response.json({ point: serializedPoint, itens }); 

    }

    async create (request: Request, response: Response){
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            itens
        } = request.body;
        
        const trx = await knex.transaction();
        const point = {
            image: request.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        }

      const insertedIds = await trx('points').insert(point);
    
        const point_id = insertedIds[0];
    
        const pointItens = itens
        .split(',')
        .map((item: string) => Number(item.trim()))
        .map((item_id: number) =>{
            return {
                item_id,
                point_id,
            };
        });
    
        await trx('points_itens').insert(pointItens);
        await trx.commit();

        return response.json({
            id: point_id,
            ...point,
        });
    }
}

export default PointsController;