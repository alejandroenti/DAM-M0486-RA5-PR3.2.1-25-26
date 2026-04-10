const fs = require('fs').promises; 

const { parseXMLFile } = require('../src/load-xml-to-mongodb');
const { processYoutuberData } = require('../src/load-xml-to-mongodb');

beforeEach(() => {
  jest.mock('fs');
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('parseXMLFile', () => {
    test('should parse XML file', async () => {
    // Arrange
    fs.readFile = jest.fn();
    fs.readFile.mockResolvedValue(`
    <?xml version="1.0" encoding="UTF-8"?>
    <youtubers>
        <youtuber id="1">
            <channel>TechReviewsXYZ</channel>
            <name>Maria García</name>
            <subscribers>5230000</subscribers>
            <joinDate>2015-03-22</joinDate>
            <categories>
            <category>Technology</category>
            <category>Reviews</category>
            </categories>
            <videos>
            <video id="v1001">
                <title>10 Best Smartphones of 2024</title>
                <duration>15:42</duration>
                <views>3500000</views>
                <uploadDate>2024-02-15</uploadDate>
                <likes>278500</likes>
                <comments>15230</comments>
            </video>
            </videos>
        </youtuber>
    </youtubers>
    `);

    // Act & Assert
    await expect(parseXMLFile('dummy-path')).resolves.toEqual({
        youtubers: {
        youtuber: {
            id: '1',
            channel: 'TechReviewsXYZ',
            name: 'Maria García',
            subscribers: '5230000',
            joinDate: '2015-03-22',
            categories: {
            category: ['Technology', 'Reviews']
            },
            videos: {
            video: {
                id: 'v1001',
                title: '10 Best Smartphones of 2024',
                duration: '15:42',
                views: '3500000',
                uploadDate: '2024-02-15',
                likes: '278500',
                comments: '15230'
            }
            }
        }
        }
    });
    });

    test('should handle fs errors', async () => {
    // Arrange
    fs.readFile = jest.fn();
    fs.readFile.mockRejectedValue(new Error('FS error'));

    // Act & Assert
    await expect(parseXMLFile('dummy-path')).rejects.toThrow('FS error');
    });

    test('should handle XML parsing errors', async () => {
    // Arrange
    fs.readFile = jest.fn();
    fs.readFile.mockResolvedValue(`Invalid XML Content`);

    // Act & Assert
    await expect(parseXMLFile('dummy-path')).rejects.toThrow();
    });
});

describe('processYoutuberData', () => {
    test('should process youtuber data correctly', () => {
    // Arrange
    const rawData = {
        youtubers: {
        youtuber: {
            id: '1',
            channel: 'TechReviewsXYZ',
            name: 'Maria García',
            subscribers: '5230000',
            joinDate: '2015-03-22',
            categories: {
            category: ['Technology', 'Reviews']
            },
            videos: {
            video: {
                id: 'v1001',
                title: '10 Best Smartphones of 2024',
                duration: '15:42',
                views: '3500000',
                uploadDate: '2024-02-15',
                likes: '278500',
                comments: '15230'
            }
            }
        }
        }
    };

    // Act
    const processedData = processYoutuberData(rawData);

    // Assert
    expect(processedData).toEqual([
        {
        youtuberId: '1',
        channel: 'TechReviewsXYZ',
        name: 'Maria García',
        subscribers: 5230000,
        joinDate: new Date('2015-03-22'),
        categories: ['Technology', 'Reviews'],
        videos: [
            {
            videoId: 'v1001',
            title: '10 Best Smartphones of 2024',
            duration: '15:42',
            views: 3500000,
            uploadDate: new Date('2024-02-15'),
            likes: 278500,
            comments: 15230
            }
        ]
        }
    ]);
    });

    test('should return empty array if no youtubers', () => {
    // Arrange
    const rawData = {};

    // Act
    const processedData = processYoutuberData(rawData);

    // Assert
    expect(processedData).toEqual([]);
    });

    test('should handle single category and video as objects', () => {
    // Arrange
    const rawData = {
        youtubers: {
        youtuber: {
            id: '1',
            channel: 'TechReviewsXYZ',
            name: 'Maria García',
            subscribers: '5230000',
            joinDate: '2015-03-22',
            categories: {
            category: 'Technology'
            },
            videos: {
            video: {
                id: 'v1001',
                title: '10 Best Smartphones of 2024',
                duration: '15:42',
                views: '3500000',
                uploadDate: '2024-02-15',
                likes: '278500',
                comments: '15230'
            }
            }
        }
        }
    };

    // Act
    const processedData = processYoutuberData(rawData);

    // Assert
    expect(processedData).toEqual([
        {
        youtuberId: '1',
        channel: 'TechReviewsXYZ',
        name: 'Maria García',
        subscribers: 5230000,
        joinDate: new Date('2015-03-22'),
        categories: ['Technology'],
        videos: [
            {
            videoId: 'v1001',
            title: '10 Best Smartphones of 2024',
            duration: '15:42',
            views: 3500000,
            uploadDate: new Date('2024-02-15'),
            likes: 278500,
            comments: 15230
            }
        ]
        }
    ]);
    });
});