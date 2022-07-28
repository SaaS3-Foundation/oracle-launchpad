import { Body, Controller, Param, Post, Response, Sse } from '@nestjs/common';
import { DapiService } from './dapi.service';
import { OIS } from '@api3/ois';
import { nanoid } from 'nanoid';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Controller('/saas3/dapi')
export class DapiController {
    constructor(private readonly dapiService: DapiService) { }

    @Post('/submit')
    async submit(@Body() ois: OIS, @Response() res) {
        // validate ois
        // if ok
        const jobId = nanoid(10);
        res.json({ "job": jobId });
        this.dapiService.submit(ois, jobId);
    }

    @Sse('/sse/:_id')
    sse(@Param() params): Observable<MessageEvent> {
        return interval(1000).pipe(map(() => ({ data: this.dapiService.status.get(params._id), id: params._id } as unknown as MessageEvent)));
    }
}
