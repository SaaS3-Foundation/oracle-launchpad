import { Body, Controller, Param, Post, Response, Sse, HttpStatus } from '@nestjs/common';
import { DapiService } from './dapi.service';
import { OIS } from '@api3/ois';
import { nanoid } from 'nanoid';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Controller('/saas3/dapi')
export class DapiController {
    constructor(private readonly dapiService: DapiService) { }

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
            res.json({...ret, ...{"msg": "OK", "code": 200}});
        } catch (e) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ "msg": e.message, "code": 500 });
        }
    }
}
