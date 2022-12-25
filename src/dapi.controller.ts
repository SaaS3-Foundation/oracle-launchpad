import {
  Body,
  Controller,
  Post,
  Response,
  Get,
  HttpStatus,
  Query,
  Delete,
  Put,
} from '@nestjs/common';
import { DapiService } from './dapi.service';
import { nanoid } from 'nanoid';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DapiRepository } from './model/dapi/dapi.respository';
import { existsSync, rmdirSync } from 'fs';
import { ok } from 'assert';
import { execSync } from 'child_process';
import { OracleRequest, HttpRequest } from './model/Request';

@Controller('/saas3/dapi')
export class DapiController {
  constructor(
    private readonly dapiService: DapiService,
    private readonly dapiRepository: DapiRepository,
  ) {}
  private created: string[] = [];

  @Post('/submit/v2')
  async submitV2(@Body() req: OracleRequest, @Response() res) {
    const jobId = nanoid(10);
    let c = await this.dapiService.checkOpenapi(req);
    if (c.ok === false) {
      return res.status(HttpStatus.BAD_REQUEST).json({ msg: c.err, code: 400 });
    }
    res.json({ msg: 'OK', code: 200, data: { job: jobId } });
    this.dapiService.submitV2(req, jobId);
  }

  @Get('/status')
  async getStatusBy(@Query('id') id: string, @Response() res) {
    let job = await this.dapiRepository.find(id);
    if (job == null) {
      return res.json({ msg: 'Not Found', code: 404 });
    }
    return res.json({
      msg: 'OK',
      code: 200,
      data: { id: id, status: this.dapiService.status(job.status) },
    });
  }

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Response() res,
  ) {
    if (size === undefined || size < 1 || page === undefined || page < 1) {
      this.dapiRepository.findAll().then((ret) => {
        res.json({ msg: 'OK', code: 200, data: ret });
      });
    } else {
      this.dapiRepository.page(page, size).then((ret) => {
        res.json({ msg: 'OK', code: 200, data: ret });
      });
    }
  }

  @Delete('/remove')
  async delete(@Query('id') id: string, @Response() res) {
    if (id === undefined) {
      return res.json({ msg: 'Invalid input', code: 400 });
    }
    let entity = await this.dapiRepository.find(id);
    if (entity == null) {
      return res.json({ msg: 'resource not found', code: 404 });
    }
    await this.dapiRepository.deleteById(id);
    return res.json({ msg: 'OK', code: 200 });
  }

  @Put('/update')
  async update(@Query('id') id: string, @Body() u: any, @Response() res) {
    if (id === undefined) {
      return res.json({ msg: 'id not defined', code: 400 });
    }
    let entity = await this.dapiRepository.find(id);
    if (entity == null) {
      return res.json({ msg: 'resource not found', code: 404 });
    }
    entity.update_at = new Date();
    await this.dapiRepository.update(entity);
    res.json({ msg: 'OK', code: 200 });
  }

  @Get('/detail')
  async detail(@Query('id') id: string, @Response() res) {
    if (id === undefined) {
      return res.json({ msg: 'Invalid input', code: 400 });
    }
    let entity = await this.dapiRepository.find(id);
    if (entity == null) {
      return res.json({ msg: `entity ${id} not Found`, code: 404 });
    }
    return res.json({ msg: 'OK', code: 200, data: entity });
  }

  dotest = async (req: HttpRequest) => {
    if (req.method === 'GET') {
      req.body = null;
    }
    try {
      const response = await fetch(req.uri, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      return { ok: true, data: await response.json() };
    } catch (e) {
      return { ok: false, errmsg: e.toString() };
    }
  };

  @Post('/testrun')
  async testrun(@Body() body: HttpRequest, @Response() res) {
    console.log(body);
    let r = await this.dotest(body);
    if (r.ok == true) {
      res.json({ msg: 'OK', code: 200, data: r.data });
    } else {
      res.json({ msg: r.errmsg, code: 500 });
    }
  }
}
