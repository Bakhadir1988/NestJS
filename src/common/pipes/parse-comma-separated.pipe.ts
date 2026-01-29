// src/common/pipes/parse-comma-separated.pipe.ts

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseCommaSeparatedPipe implements PipeTransform<
  string,
  string[]
> {
  transform(value: string): string[] {
    // 1. Если параметр не передан (`undefined`) или он пустой (`''`),
    //    то просто возвращаем пустой массив.
    if (!value) {
      return [];
    }

    // 2. Если параметр есть, но это не строка (как в тесте с `?tags[key]=value`),
    //    тогда выбрасываем ошибку.
    if (typeof value !== 'string') {
      throw new BadRequestException('Tags parameter must be a string');
    }

    // 3. Если все хорошо, выполняем основную логику.
    return value.split(',').map((item) => item.trim());
  }
}
