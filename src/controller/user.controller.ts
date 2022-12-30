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
import { UserService } from '../service/user.service';
import { nanoid } from 'nanoid';
import { UserRepository } from '../model/user/user.respository';
import { UserEntity } from '../model/user/user.entity';
import { AuthInterceptor } from '../common/interceptor/auth.interceptor';
import { AdminInterceptor } from '../common/interceptor/admin.interceptor';
import { WalletRequest } from 'src/model/Request';
import { verifyMessage } from 'src/utils/utils';

@Controller('/saas3/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {}

  @Post('/login/:address')
  @UseInterceptors(AuthInterceptor)
  async login(@Param() params, @Body() req: UserEntity, @Response() res) {
    const existUser = await this.userService.findByAddress(params.address);
    if (existUser) {
      return res.json({
        msg: 'This address already exists.',
        code: 200,
        data: existUser,
      });
    }
    const user = req;
    if (!user.walletInfo?.length) {
      return res.json({
        msg: 'No wallet info.',
        code: 400,
      });
    }
    if (user.walletInfo.length > 1) {
      return res.json({
        msg: 'Only 1 wallet address allowed when you first login',
        code: 400,
      });
    }

    res.json({
      msg: 'OK',
      code: 200,
      data: await this.userRepository.save({
        ...req,
        id: nanoid(10),
      }),
    });
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
    const entity = await this.userRepository.find(params.id);
    if (entity == null) {
      return res.json({ msg: 'resource not found', code: 404 });
    }
    await this.userRepository.deleteById(params.id);
    return res.json({ msg: 'OK', code: 200 });
  }

  @Put('/update/:id')
  @UseInterceptors(AuthInterceptor)
  async update(@Param() params, @Body() u: UserEntity, @Response() res) {
    if (params.id === undefined) {
      return res.json({ msg: 'id not defined', code: 400 });
    }
    const entity = await this.userRepository.find(params.id);
    if (entity == null) {
      return res.json({ msg: 'resource not found', code: 404 });
    }
    // except wallet info
    u.walletInfo = entity.walletInfo;
    // and oracles
    u.oracles = entity.oracles;
    // in case id missing
    u.id = params.id;
    const n = await this.userRepository.update(u);
    res.json({ msg: 'OK', code: 200, data: n });
  }

  @Post('/:id/wallet/add')
  @UseInterceptors(AuthInterceptor)
  async addWallet(@Param() params, @Body() w: WalletRequest, @Response() res) {
    if (params.id === undefined) {
      return res.json({ msg: 'id not defined', code: 400 });
    }
    const entity = await this.userRepository.find(params.id);
    if (entity == null) {
      return res.json({ msg: 'resource not found', code: 404 });
    }
    const f = entity.walletInfo.find((wa) => wa.address == w.address);
    if (f !== undefined) {
      // do nothing
      return entity;
    }
    if (verifyMessage(w.address, w.nonce, w.signature)) {
      entity.walletInfo.push({ chain: w.chain, address: w.address });
    }
    const nu = await this.userRepository.update(entity);
    return res.json({ msg: 'OK', code: 200, data: nu });
  }

  @Get('/admin/detail/:userAddress')
  @UseInterceptors(AdminInterceptor)
  async detail(@Param() params, @Response() res) {
    const { userAddress } = params;
    const entity = await this.userService.findByAddress(userAddress);
    if (!entity) {
      return res.json({
        msg: `entity ${userAddress} not Found`,
        code: 404,
      });
    }
    return res.json({ msg: 'OK', code: 200, data: entity });
  }
}
