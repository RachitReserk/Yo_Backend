import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.userModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });
    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.userModel.create({
      ...dto,
      password: hashedPassword,
    });

    const { password, ...result } = newUser.toObject();
    return result;
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload = { sub: user._id, username: user.username };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async getMe(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(userId.sub).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user.toObject();
  }
}
