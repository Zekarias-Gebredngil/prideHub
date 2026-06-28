import {
  IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsUUID,
  IsDateString, Min, Max, ValidateNested, IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CommissionType, SubscriptionTier } from '@prisma/client';

export class CommissionTierDto {
  @ApiProperty({ description: 'Min booking amount for this tier' })
  @IsNumber()
  @Min(0)
  minAmount: number;

  @ApiPropertyOptional({ description: 'Max booking amount (null = unlimited)' })
  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @ApiProperty({ description: 'Commission rate (0.0 to 1.0)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;
}

export class CreateCommissionRuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CommissionType, default: CommissionType.PERCENTAGE })
  @IsEnum(CommissionType)
  type: CommissionType;

  @ApiPropertyOptional({ description: 'Rate for PERCENTAGE type (0.0–1.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  rate?: number;

  @ApiPropertyOptional({ description: 'Fixed amount for FIXED_AMOUNT type' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAmount?: number;

  @ApiPropertyOptional({ description: 'Tiers for TIERED type' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionTierDto)
  tiers?: CommissionTierDto[];

  @ApiPropertyOptional({ description: 'Vendor override ID' })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Vendor category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: SubscriptionTier })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  subscriptionTier?: SubscriptionTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateCommissionRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class CalculateCommissionDto {
  @ApiProperty()
  @IsUUID()
  bookingId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  globalDefaultRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  platformFeeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  escrowHoldDays?: number;
}
