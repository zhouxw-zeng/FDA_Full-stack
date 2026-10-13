import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilesService, UploadedLocalFile } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传本地文件并按文件类型和日期自动归档' })
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
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
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
