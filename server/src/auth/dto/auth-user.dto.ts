import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: '林致远' })
  nickname: string;

  @ApiProperty({ example: 'lin.zhiyuan@album-forum.dev' })
  email: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', nullable: true })
  avatar: string | null;

  @ApiProperty({ example: '平台运营中心', nullable: true })
  department: string | null;

  @ApiProperty({ example: '负责论坛内容治理与审核策略。', nullable: true })
  bio: string | null;

  @ApiProperty({ example: '1' })
  roleId: string;

  @ApiProperty({ example: '超级管理员' })
  roleName: string;

  @ApiProperty({ example: [1, 13], type: [Number] })
  routeIdGroup: number[];
}
