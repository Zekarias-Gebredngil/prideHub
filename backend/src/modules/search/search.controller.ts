import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Global search across all entities' })
  globalSearch(@Query('q') query: string, @Query('limit') limit = 5) {
    return this.searchService.globalSearch(query, +limit);
  }

  @Public()
  @Get('entity')
  @ApiOperation({ summary: 'Full-text search for a specific entity' })
  entitySearch(
    @Query('q') query: string,
    @Query('entity') entity: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.searchService.fullTextSearch(query, entity, +page, +limit);
  }
}
