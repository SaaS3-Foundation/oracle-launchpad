import {
  Body,
  Controller,
  Post,
  Response,
  Get,
  HttpStatus,
  Query,
  Delete,
  Patch,
} from '@nestjs/common';
import { DapiService } from './dapi.service';
import { OIS } from '@api3/ois';
import { nanoid } from 'nanoid';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DapiRepository } from './model/dapi/dapi.respository';
import { existsSync, rmdirSync } from 'fs';
import { ok } from 'assert';
import { execSync } from 'child_process';

@Controller('/saas3/dapi')
export class DapiController {
  constructor(
    private readonly dapiService: DapiService,
    private readonly dapiRepository: DapiRepository,
  ) {}
  private created: string[] = [];

  @Post('/submit')
  async submit(
    @Query('address') address: string,
    @Body() ois: any,
    @Response() res,
  ) {
    // validate ois
    // if ok
    const jobId = nanoid(10);
    let c = await this.dapiService.check(ois, address);
    if (c.ok === false) {
      return res.status(HttpStatus.BAD_REQUEST).json({ msg: c.err, code: 400 });
    }
    let exist = this.created.includes(address);
    if (exist === true) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        msg: 'Your Orale Request Has been Already Submitted',
        code: 400,
      });
    }
    this.created.push(address);
    res.json({ msg: 'OK', code: 200, data: { job: jobId } });
    this.dapiService.submit(ois, jobId, address);
  }

  @Post('/submit/v2')
  async submitV2(@Body() spec: any, @Response() res) {
    const jobId = nanoid(10);
    let c = await this.dapiService.checkOpenapi(spec);
    if (c.ok === false) {
      return res.status(HttpStatus.BAD_REQUEST).json({ msg: c.err, code: 400 });
    }
    res.json({ msg: 'OK', code: 200, data: { job: jobId } });
    this.dapiService.submitV2(spec, jobId);
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

  @Post('/acquire')
  async acquire(@Body() requester: string, @Response() res) {
    try {
      let ret = await this.dapiService.acquire(requester);
      res.json({ ...ret, ...{ msg: 'OK', code: 200 } });
    } catch (e) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ msg: e.message, code: 500 });
    }
  }

  @Get('/list')
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Response() res,
  ) {
    // const teststr = nanoid(10);
    // await this.dapiService.calltest(teststr);
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
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ msg: 'Not Found', code: 404 });
    }
    let dir = `workspace/evm/${id}`;
    if (existsSync(dir)) {
      rmdirSync(dir, {
        recursive: true,
      });
    }

    let cmd = `docker stop ${id}`;
    execSync(cmd);
    cmd = `docker rm -f ${id}`;
    execSync(cmd);

    await this.dapiRepository.deleteById(id);
    return res.json({ msg: 'OK', code: 200 });
  }
  @Patch('/update')
  async update(@Query('id') id: string, @Body() u: any, @Response() res) {
    if (id === undefined) {
      return res.json({ msg: 'id not defined', code: 400 });
    }
    let entity = await this.dapiRepository.find(id);
    if (entity == null) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ msg: `entity ${id} not Found`, code: 404 });
    }
    if (u['description'] !== undefined) {
      entity.description = u['description'];
    }
    if (u['demo'] !== undefined) {
      entity.demo = u['demo'];
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
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ msg: `entity ${id} not Found`, code: 404 });
    }
    return res.json({ msg: 'OK', code: 200, data: entity });
  }

  @Get("/trigger/deploy")
  async triggerDeploy(@Response() res) {
  }
}
