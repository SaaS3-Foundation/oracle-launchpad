import {
  Body,
  Controller,
  Post,
  Response,
  Get,
  Query,
  Delete,
  Put,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { DapiService } from '../../service/dapi.service';
import { DapiRepository } from '../../model/dapi/dapi.respository';
import { AuthInterceptor } from 'src/common/interceptor/auth.interceptor';
import { UserRepository } from 'src/model/user/user.respository';
import { ConfigService } from '@nestjs/config';
import { DapiEntity } from 'src/model/dapi/dapi.entity';
import { UserEntity } from 'src/model/user/user.entity';
import { JobStatus } from 'src/model/dapi/types';
import { Web2InfoEntity } from 'src/model/web2Info/web2Info.entity';
import { nanoid } from 'nanoid';

@Controller('/saas3/dapi')
export class DapiController {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly dapiService: DapiService,
    private readonly dapiRepository: DapiRepository,
    private readonly configService: ConfigService,
  ) {}

  @Post('/submit/v2/:userId')
  @UseInterceptors(AuthInterceptor)
  async submitV2(@Param() params, @Body() body: DapiEntity, @Response() res) {
    const { userId } = params;
    const user = await this.userRepository.getOneById(userId);
    if (!user) {
      return res.json({ msg: 'user is not exists', code: 400 });
    }

    const entity: DapiEntity = {
      ...body,
      creator: new UserEntity({ id: userId }),
      status:
        this.configService.get('NODE_ENV') === 'development'
          ? JobStatus.DONE
          : JobStatus.PENDING,
      logo_url: '/',
      id: nanoid(),
    };

    if (this.configService.get('NODE_ENV') === 'development') {
      entity.oracleInfo.address = '0x1111';
    }

    const c = await this.dapiService.checkOpenapi(entity);
    if (!c.ok) {
      return res.json({ msg: c.err, code: 400 });
    }
    try {
      if (this.configService.get('NODE_ENV') === 'development') {
        await this.dapiService.save(entity);
      } else {
        await this.dapiService.submitV2(entity);
      }
      return res.json({ msg: 'OK', code: 200, data: { id: entity.id } });
    } catch (error) {
      res.json({ msg: error?.message || 'Failed to deploy oracle', code: 500 });
    }
  }

  @Get('/status')
  async getStatusBy(@Query('id') id: string, @Response() res) {
    const job = await this.dapiRepository.find(id);
    if (!job) {
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
    @Query('searchValue') searchValue: string,
    @Response() res,
  ) {
    const nsize = Number(size) || 20;
    const npage = Number(page) || 1;
    this.dapiRepository.page(npage, nsize, searchValue || '').then((ret) => {
      res.json({ msg: 'OK', code: 200, data: ret });
    });
  }

  @Delete('/remove')
  async delete(@Query('id') id: string, @Response() res) {
    if (id === undefined) {
      return res.json({ msg: 'Invalid input', code: 400 });
    }
    const entity = await this.dapiRepository.find(id);
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
    const entity = await this.dapiRepository.find(id);
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
    const entity = await this.dapiRepository.find(id);
    if (entity == null) {
      return res.json({ msg: `entity ${id} not Found`, code: 404 });
    }
    return res.json({ msg: 'OK', code: 200, data: entity });
  }

  dotest = async (req: Web2InfoEntity) => {
    if (req.method === 'GET') {
      req.body = null;
    }
    try {
      const response = await fetch(req.uri, {
        method: req.method,
        headers: req.headers,
        body: req.body as any,
      });
      return { ok: true, data: await response.json() };
    } catch (e) {
      return { ok: false, errmsg: e.toString() };
    }
  };

  @Post('/testrun')
  async testrun(@Body() body: Web2InfoEntity, @Response() res) {
    const r = await this.dotest(body);
    if (r.ok == true) {
      res.json({ msg: 'OK', code: 200, data: r.data });
    } else {
      res.json({ msg: r.errmsg, code: 500 });
    }
  }
}
