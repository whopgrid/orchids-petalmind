import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { generatedImages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !session.user) {
    return null;
  }
  return session.user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const imageId = parseInt(params.imageId);
    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Valid image ID is required', code: 'INVALID_IMAGE_ID' },
        { status: 400 }
      );
    }

    const image = await db
      .select()
      .from(generatedImages)
      .where(
        and(
          eq(generatedImages.id, imageId),
          eq(generatedImages.userId, user.id)
        )
      )
      .limit(1);

    if (image.length === 0) {
      return NextResponse.json(
        { error: 'Image not found or access denied', code: 'IMAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(image[0], { status: 200 });
  } catch (error) {
    console.error('GET image error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const imageId = parseInt(params.imageId);
    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Valid image ID is required', code: 'INVALID_IMAGE_ID' },
        { status: 400 }
      );
    }

    const existingImage = await db
      .select()
      .from(generatedImages)
      .where(
        and(
          eq(generatedImages.id, imageId),
          eq(generatedImages.userId, user.id)
        )
      )
      .limit(1);

    if (existingImage.length === 0) {
      return NextResponse.json(
        { error: 'Image not found or access denied', code: 'IMAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(generatedImages)
      .where(
        and(
          eq(generatedImages.id, imageId),
          eq(generatedImages.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Image deleted successfully',
        deletedImage: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE image error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}