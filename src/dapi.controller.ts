import { Body, Controller, Param, Post, Response, Get, HttpStatus, Query } from '@nestjs/common';
import { DapiService } from './dapi.service';
import { OIS } from '@api3/ois';
import { nanoid } from 'nanoid';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DapiRepository } from './model/dapi/dapi.respository';


@Controller('/saas3/dapi')
export class DapiController {
    constructor(private readonly dapiService: DapiService,
        private readonly dapiRepository: DapiRepository) { }

    @Post('/submit')
    async submit(@Body() ois: any, @Response() res) {
        // validate ois
        // if ok
        const jobId = nanoid(10);
        if (!this.dapiService.check(ois)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ "msg": "Invalid input", "code": 400 });
        }
        res.json({ "msg": "OK", code: 200, "job": jobId });
        this.dapiService.submit(ois, jobId);
    }

    @Post("/acquire")
    async acquire(@Body() requester: string, @Response() res) {
        try {
            let ret = await this.dapiService.acquire(requester);
            res.json({ ...ret, ...{ "msg": "OK", "code": 200 } });
        } catch (e) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ "msg": e.message, "code": 500 });
        }
    }

    @Get("/list")
    async list(@Query('page') page: number, @Query("size") size: number, @Response() res) {
        if ((size === undefined || size < 1) || (page === undefined || page < 1)) {
            this.dapiRepository.findAll().then(ret => {
                res.json({ "msg": "OK", "code": 200, "data": ret });
            });
        } else {
            this.dapiRepository.page(page, size).then(ret => {
                res.json({ "msg": "OK", "code": 200, "data": ret });
            });
        }
    }

    @Get("/detail")
    async detail(@Query('id') id: string, @Response() res) {
        if (id === undefined) {
            return res.json({ "msg": "Invalid input", "code": 400 });
        }
        let entity = await this.dapiRepository.find(id);
        if (entity == null) {
            return res.status(HttpStatus.NOT_FOUND).json({ "msg": "Not Found", "code": 404 });
        }
        return res.json({ "msg": "OK", "code": 200, "data": entity });
    }
}
