// Content API
// Handles content-related API calls for estimation screen

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/**
 * Content data interface based on the provided JSON structure
 */
export interface ContentItem {
  ContentID: number
  ContentName: string
  ContentCaption: string
  ContentOpenHref: string
  ContentClosedHref: string
  ContentSizes: string // Comma-separated list like "SizeHeight,SizeWidth"
  ContentDomainType: string
  ContentSizeInputUnit: string
  ContentSizeInputDecimalValue: number
  ContentOrientation?: string // Content orientation (BookPages, Leaves, etc.)
  ZipperWeightPerMeter?: number // Zipper weight per meter (ROTOGRAVURE + SPOUT/ZIPPER)
  SizeZipperLength?: number // Zipper length size (ROTOGRAVURE + ZIPPER)
  IsDefaultContent?: boolean | string | number // Default content for category — auto-added to cost table
}

/**
 * Parsed content sizes for easier handling
 */
export interface ParsedContentSizes {
  SizeHeight?: boolean
  SizeWidth?: boolean
  SizeLength?: boolean
  JobPrePlan?: boolean
  JobAcrossUps?: boolean
  JobAroundUps?: boolean
  JobUps?: boolean
}

/**
 * Content display interface with normalized image paths
 */
export interface DisplayContent extends ContentItem {
  // Normalized image paths for the application
  imagePath: string
  imagePathClosed?: string
  // Parsed sizes for easier UI handling
  availableSizes: ParsedContentSizes
  // Color for UI display (can be determined by domain type)
  displayColor: string
}

/**
 * Content API class for handling content-related operations
 */
export class ContentAPI {
  /**
   * Get category allocated contents from the API
   * @param categoryID - The category ID to fetch contents for
   * @param sessionData - Optional session data for authentication
   * @returns Promise with content items array
   */
  static async getCategoryAllocatedContents(
    categoryID: string | number,
    sessionData?: any
  ): Promise<APIResponse<ContentItem[]>> {
    try {
      const endpoint = `api/planwindow/GetCategoryAllocatedContents/${categoryID}`
      const response = await APIClient.get<ContentItem[]>(endpoint, sessionData)

      // Validate that data is actually an array
      // Sometimes the API returns error strings with 200 OK status
      if (response.success && response.data) {
        if (!Array.isArray(response.data)) {
          // API returned an error message as a string instead of an array
          const errorMessage = typeof response.data === 'string'
            ? response.data
            : 'API returned invalid data format (expected array, got string)'

          console.error('❌ Content API returned error string:', errorMessage)

          return {
            success: false,
            error: errorMessage,
            data: []
          }
        }
      }

      return response
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch category contents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      }
    }
  }

  /**
   * Parse content sizes string into a more usable object
   * @param contentSizes - Comma-separated string like "SizeHeight,SizeWidth"
   * @returns Parsed sizes object
   */
  static parseContentSizes(contentSizes: string): ParsedContentSizes {
    const sizes: ParsedContentSizes = {}

    if (!contentSizes) return sizes

    const sizeArray = contentSizes.split(',').map(s => s.trim())

    sizeArray.forEach(size => {
      switch (size) {
        case 'SizeHeight':
          sizes.SizeHeight = true
          break
        case 'SizeWidth':
          sizes.SizeWidth = true
          break
        case 'SizeLength':
          sizes.SizeLength = true
          break
        case 'JobPrePlan':
          sizes.JobPrePlan = true
          break
        case 'JobAcrossUps':
          sizes.JobAcrossUps = true
          break
        case 'JobAroundUps':
          sizes.JobAroundUps = true
          break
        case 'JobUps':
          sizes.JobUps = true
          break
        default:
          // Handle any other size types that might be added
          (sizes as any)[size] = true
      }
    })

    return sizes
  }

  /**
   * Normalize image path to work with the application structure
   * @param href - Original href from API like "images/Contents/Label.jpg"
   * @returns Normalized path for the application
   */
  static normalizeImagePath(href: string): string {
    if (!href) return '/Contents/Rectangular.jpg'

    let normalizedPath = ''

    // Convert API path format to application path format
    // API: "images/Contents/Label.jpg"
    // App: "/Contents/Label.jpg" (images/ removed since Contents is now in public root)
    if (href.startsWith('images/Contents/')) {
      normalizedPath = '/' + href.replace('images/', '')
    } else if (href.startsWith('/')) {
      // If already starts with /, return as is
      normalizedPath = href
    } else {
      // Default fallback
      normalizedPath = '/Contents/' + href
    }

    return normalizedPath
  }

  /**
   * Get display color based on content domain type
   * @param domainType - The domain type like "Flexo", "Offset", etc.
   * @returns CSS color class
   */
  static getDisplayColor(domainType: string): string {
    // Spelled out per case — a template literal inside a class name would not
    // survive the Tailwind build.
    switch (domainType?.toLowerCase()) {
      case 'flexo':
        return 'bg-[rgb(var(--color-info))]'
      case 'offset':
        return 'bg-[rgb(var(--color-success))]'
      case 'digital':
        return 'bg-[rgb(var(--color-purple))]'
      case 'finishing':
        return 'bg-[rgb(var(--color-orange))]'
      default:
        return 'bg-[rgb(var(--color-neutral))]'
    }
  }

  /**
   * Transform API content items to display-ready format
   * @param contentItems - Raw content items from API
   * @returns Display-ready content items
   */
  static transformForDisplay(contentItems: ContentItem[]): DisplayContent[] {
    // Safety check: ensure contentItems is an array
    if (!Array.isArray(contentItems)) {
      console.error('❌ transformForDisplay: contentItems is not an array:', contentItems)
      return []
    }

    return contentItems.map(item => ({
      ...item,
      imagePath: this.normalizeImagePath(item.ContentOpenHref),
      imagePathClosed: item.ContentClosedHref ? this.normalizeImagePath(item.ContentClosedHref) : undefined,
      availableSizes: this.parseContentSizes(item.ContentSizes),
      displayColor: this.getDisplayColor(item.ContentDomainType)
    }))
  }

  /**
   * Get contents with automatic transformation for display
   * @param categoryID - The category ID to fetch contents for
   * @param sessionData - Optional session data for authentication
   * @returns Promise with display-ready content items
   */
  static async getDisplayContents(
    categoryID: string | number,
    sessionData?: any
  ): Promise<APIResponse<DisplayContent[]>> {
    const response = await this.getCategoryAllocatedContents(categoryID, sessionData)

    if (response.success && response.data) {
      const displayContents = this.transformForDisplay(response.data)
      return {
        ...response,
        data: displayContents
      }
    }

    return {
      ...response,
      data: []
    }
  }

  /**
   * Search contents by name or caption
   * @param contentItems - Array of content items to search
   * @param searchTerm - Search term
   * @returns Filtered content items
   */
  static searchContents(contentItems: DisplayContent[], searchTerm: string): DisplayContent[] {
    if (!searchTerm.trim()) return contentItems

    const term = searchTerm.toLowerCase()
    return contentItems.filter(item =>
      item.ContentName.toLowerCase().includes(term) ||
      item.ContentCaption.toLowerCase().includes(term)
    )
  }

  /**
   * Filter contents by domain type
   * @param contentItems - Array of content items to filter
   * @param domainType - Domain type to filter by
   * @returns Filtered content items
   */
  static filterByDomainType(contentItems: DisplayContent[], domainType: string): DisplayContent[] {
    if (!domainType) return contentItems

    return contentItems.filter(item =>
      item.ContentDomainType.toLowerCase() === domainType.toLowerCase()
    )
  }

  /**
   * Get unique domain types from content items
   * @param contentItems - Array of content items
   * @returns Array of unique domain types
   */
  static getUniqueDomainTypes(contentItems: DisplayContent[]): string[] {
    const types = contentItems.map(item => item.ContentDomainType)
    return [...new Set(types)].sort()
  }
}
