import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';

const uri = 'mongodb://127.0.0.1:27017/convoverse';

@Module({
  imports: [MongooseModule.forRoot(uri), UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
