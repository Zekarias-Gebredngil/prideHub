import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { CreateVenueDto } from './venues.service';

describe('CreateVenueDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateVenueDto,
    data: '',
  };

  it('accepts the admin venue creation payload', async () => {
    const payload = {
      name: 'Hilton Lexury',
      shortDesc: 'The priceless',
      address: 'Menelik II Ave, Addis Ababa 1164',
      capacity: 1500,
      city: 'Addis Abeba',
      country: 'Ethiopia',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Hilton+Addis+Ababa',
      isFeatured: true,
      minCapacity: 500,
      pricePerDay: 100000,
    };

    await expect(pipe.transform(payload, metadata)).resolves.toMatchObject(payload);
  });

  it('still rejects fields that are not part of the venue contract', async () => {
    await expect(
      pipe.transform({ name: 'Hilton Lexury', unexpected: 'value' }, metadata),
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining(['property unexpected should not exist']),
      },
    });
  });
});
