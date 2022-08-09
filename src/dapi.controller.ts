import { Body, Controller, Param, Post, Response, Get, HttpStatus, Query } from '@nestjs/common';
import { DapiService } from './dapi.service';
import { OIS } from '@api3/ois';
import { nanoid } from 'nanoid';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DapiRepository} from './model/dapi/dapi.respository';


@Controller('/saas3/dapi')
export class DapiController {
    constructor(private readonly dapiService: DapiService,
        private readonly dapiRepository: DapiRepository) { }

    @Post('/submit')
    async submit(@Body() ois: any, @Response() res) {
        // validate ois
        // if ok
        const jobId = nanoid(10);
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
        if (size < 1 || page < 1) {
            this.dapiRepository.findAll().then(ret => {
                res.json({ "msg": "OK", "code": 200, "data": ret });
            });
        } else {
            this.dapiRepository.page(page, size).then(ret => {
                res.json({ "msg": "OK", "code": 200, "data": ret });
            });
        }
    }
}
