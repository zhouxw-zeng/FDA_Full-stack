import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { FilesService, UploadedLocalFile } from '../files/files.service';
import { UploadFileDto } from '../files/dto/upload-file.dto';
import { MobileAuthGuard } from './guards/mobile-auth.guard';

@ApiTags('mobile / files')
@ApiBearerAuth()
@Controller('mobile-files')
@Public()
@UseGuards(MobileAuthGuard)
export class MobileFilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('avatars')
  @ApiOperation({ summary: '查询默认头像列表' })
  listAvatarOptions() {
    return this.filesService.listAvatarOptions();
  }

  @Post('upload')
  @ApiOperation({ summary: '移动端上传本地文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        fileName: { type: 'string' },
        storageAddress: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: UploadedLocalFile | undefined,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    return this.filesService.uploadFile(
      file,
      uploadFileDto.fileName,
      uploadFileDto.storageAddress,
      uploadFileDto.overwrite ?? false,
    );
  }
}
