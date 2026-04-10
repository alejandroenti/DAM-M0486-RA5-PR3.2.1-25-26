const fs = require('fs').promises; 

const { parseXMLFile } = require('../src/load-xml-to-mongodb');

test('should parse XML file', async () => {
  // Arrange
  jest.mock('fs');
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
  expect(await parseXMLFile('dummy-path')).toEqual({
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