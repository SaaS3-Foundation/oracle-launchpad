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
import { AuthInterceptor } from 'src/common/interceptor/auth.interceptor';

@Controller('/saas3/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {}

  @Post('/register/:userAddress')
  async register(@Param() params, @Body() req: UserEntity, @Response() res) {
    const { userAddress } = params;
    const user = await this.userRepository.findByAddress(userAddress);
    if (user) {
      return res.json({
        msg: 'This address already exists.',
        code: 500,
        data: user,
      });
    }
    res.json({
      msg: 'OK',
      code: 200,
      data: await this.userService.register({
        ...req,
        id: nanoid(10),
        userAddress,
      }),
    });
  }

  @Get('/list')
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

  @Delete('/remove/:id')
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
    u.update_at = new Date();
    u.id = params.id;
    await this.userRepository.update(u);
    res.json({ msg: 'OK', code: 200 });
  }

  @Get('/detail/:userAddress')
  async detail(@Param() params, @Response() res) {
    const { userAddress } = params;
    const entity = await this.userRepository.findByAddress(userAddress);
    if (!entity) {
      return res.json({
        msg: `entity ${userAddress} not Found`,
        code: 404,
      });
    }
    return res.json({ msg: 'OK', code: 200, data: entity });
  }
}
