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
import { UserService } from '../../service/user.service';
import { UserRepository } from '../../model/user/user.respository';
import { UserEntity } from '../../model/user/user.entity';
import { AuthInterceptor } from '../../common/interceptor/auth.interceptor';
import { AdminInterceptor } from '../../common/interceptor/admin.interceptor';
import { verifyMessage } from 'src/utils/utils';
import { nanoid } from 'nanoid';

@Controller('/saas3/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {}

  @Post('/login/:address')
  @UseInterceptors(AuthInterceptor)
  async login(@Param() params, @Body() body: UserEntity, @Response() res) {
    const existUser = await this.userRepository.getOneByAddress(params.address);
    if (existUser) {
      return res.json({
        msg: 'This address already exists.',
        code: 200,
        data: existUser,
      });
    }
    if (!body.wallets?.length) {
      return res.json({
        msg: 'No wallet info.',
        code: 400,
      });
    }
    if (body.wallets.length > 1) {
      return res.json({
        msg: 'Only 1 wallet address allowed when you first login',
        code: 400,
      });
    }
    body.id = nanoid();
    try {
      await this.userService.saveUser(body);
      res.json({
        msg: 'OK',
        code: 200,
        data: body,
      });
    } catch (error) {
      return res.json({
        msg: 'Failed to register.',
        code: 400,
      });
    }
  }

  @Get('/admin/list')
  @UseInterceptors(AdminInterceptor)
  async list(
    @Query('page') page: number,
    @Query('size') size: number,
    @Response() res,
  ) {
    if (size === undefined || size < 1 || page === undefined || page < 1) {
      this.userRepository.findAll().then((ret) => {
        res.json({ msg: 'OK', code: 200, data: ret });
      });
    } else {
      this.userRepository.page(page, size).then((ret) => {
        res.json({ msg: 'OK', code: 200, data: ret });
      });
    }
  }

  @Delete('admin/remove/:id')
  @UseInterceptors(AdminInterceptor)
  async delete(@Param() params, @Response() res) {
    if (params.id === undefined) {
      return res.json({ msg: 'Invalid id', code: 400 });
    }
    const entity = await this.userRepository.getOneById(params.id);
    if (entity == null) {
      return res.json({ msg: 'resource not found', code: 404 });
    }
    await this.userRepository.deleteById(params.id);
    return res.json({ msg: 'OK', code: 200 });
  }

  @Put('/update/:id')
  @UseInterceptors(AuthInterceptor)
  async update(@Param() params, @Body() body: UserEntity, @Response() res) {
    if (params.id === undefined) {
      return res.json({ msg: 'id not defined', code: 400 });
    }
    const entity = await this.userRepository.getOneById(params.id);
    if (!entity) {
      return res.json({ msg: 'resource not found', code: 404 });
    }
    body.id = params.id;
    try {
      const n = await this.userRepository.update(body);
      res.json({ msg: 'OK', code: 200, data: n });
    } catch (error) {
      res.json({ msg: 'Failed to update userinfo.', code: 500 });
    }
  }

  @Post('/:id/wallet/add')
  @UseInterceptors(AuthInterceptor)
  async addWallet(@Param() params, @Body() body: any, @Response() res) {
    if (params.id === undefined) {
      return res.json({ msg: 'id not defined', code: 400 });
    }
    const entity = await this.userRepository.getOneById(params.id);
    if (entity == null) {
      return res.json({ msg: 'resource not found', code: 404 });
    }
    const f = entity.wallets.find((wa) => wa.address == body.address);
    if (f !== undefined) {
      // do nothing
      return entity;
    }
    if (verifyMessage(body.address, body.nonce, body.signature)) {
      entity.wallets.push({ chain: body.chain, address: body.address });
    }
    const nu = await this.userRepository.update(entity);
    return res.json({ msg: 'OK', code: 200, data: nu });
  }

  @Get('/admin/detail/:userAddress')
  @UseInterceptors(AdminInterceptor)
  async detail(@Param() params, @Response() res) {
    const { userAddress } = params;
    const entity = await this.userRepository.getOneByAddress(userAddress);
    if (!entity) {
      return res.json({
        msg: `entity ${userAddress} not Found`,
        code: 404,
      });
    }
    return res.json({ msg: 'OK', code: 200, data: entity });
  }
}
