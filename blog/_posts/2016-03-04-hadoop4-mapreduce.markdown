---
layout: post
title: "Hadoop(4)-MapReduce"
date: 2016-03-04 16:33
categories: ["大数据", "Hadoop", "MapReduce"]
---

在之前建立的HDFS基础上，自己编写MapReduce程序，打包，并运行。

重新打包WordCount并执行
-------------------------

新建一个Maven项目，将示例程序中WordCount.java的复制到新项目中，使用mvn clean package打包为jar文件并复制到服务器。

WordCount.java内容如下：

    public class WordCount {

      public static class TokenizerMapper 
           extends Mapper<Object, Text, Text, IntWritable>{
        
        private final static IntWritable one = new IntWritable(1);
        private Text word = new Text();
          
        public void map(Object key, Text value, Context context
                        ) throws IOException, InterruptedException {
          StringTokenizer itr = new StringTokenizer(value.toString());
          while (itr.hasMoreTokens()) {
            word.set(itr.nextToken());
            context.write(word, one);
          }
        }
      }
      
      public static class IntSumReducer 
           extends Reducer<Text,IntWritable,Text,IntWritable> {
        private IntWritable result = new IntWritable();

        public void reduce(Text key, Iterable<IntWritable> values, 
                           Context context
                           ) throws IOException, InterruptedException {
          int sum = 0;
          for (IntWritable val : values) {
            sum += val.get();
          }
          result.set(sum);
          context.write(key, result);
        }
      }

      public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        String[] otherArgs = new GenericOptionsParser(conf, args).getRemainingArgs();
        if (otherArgs.length < 2) {
          System.err.println("Usage: wordcount <in> [<in>...] <out>");
          System.exit(2);
        }
        Job job = Job.getInstance(conf, "word count");
        job.setJarByClass(WordCount.class);
        job.setMapperClass(TokenizerMapper.class);
        job.setCombinerClass(IntSumReducer.class);
        job.setReducerClass(IntSumReducer.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);
        for (int i = 0; i < otherArgs.length - 1; ++i) {
          FileInputFormat.addInputPath(job, new Path(otherArgs[i]));
        }
        FileOutputFormat.setOutputPath(job,
          new Path(otherArgs[otherArgs.length - 1]));
        System.exit(job.waitForCompletion(true) ? 0 : 1);
      }
    }

在服务器上创建一个test.txt文件，内容为：

    This is a test.

将文件复制到HDFS中：

    hadoop/bin/hdfs dfs -put test.txt /mrtest/input

使用下面的命令执行WorkCount：

    hadoop/bin/hadoop jar hadoop-mapreduce-demo-0.0.1-SNAPSHOT.jar com.u3dspace.hadoop.mapreduce.demo.WordCount /mrtest/input /mrtest/output

查看输出结果：

    hadoop/bin/hdfs dfs -cat /mrtest/output/part-r-00000

    This    1
    a       1
    is      1
    test.   1

自定义Writable
-------------------------

定义一个类CountWritable：

    public class CountWritable implements Writable {
        private int count;
        
        public CountWritable() {
            this.count = 0;
        }
        public CountWritable(int count) {
            this.count = count;
        }
        
        public int getCount() {
            return count;
        }
        public void setCount(int count) {
            this.count = count;
        }
        
        public void readFields(DataInput in) throws IOException {
            this.count = in.readInt();
        }
        
        public void write(DataOutput out) throws IOException {
            out.writeInt(this.count);
        }
        
        @Override
        public String toString() {
            return Integer.toString(this.count);
        }
    }

将刚才示例中的IntWritable换成CountWritable，打包到服务器执行，输出的结果和上一次相同。

依赖第三方jar包
---------------------------

当需要使用第三方jar包时，简单的方法是在打包时将第三方jar包也打进去，Maven中配置一个plugin，如下：

    <build>
        <plugins>
            <plugin>
                <artifactId>maven-assembly-plugin</artifactId>
                <configuration>
                    <descriptorRefs>
                        <descriptorRef>jar-with-dependencies</descriptorRef>
                    </descriptorRefs>
                    <archive>
                        <manifest>
                            <mainClass></mainClass>
                        </manifest>
                    </archive>
                </configuration>
                <executions>
                    <execution>
                        <id>make-assembly</id>
                        <phase>package</phase>
                        <goals>
                            <goal>single</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>

然后使用mvn package打包后，在target/目录下会多一个以-jar-with-dependencies.jar为后缀的jar包，在服务器执行这个jar包即可。

使用yarn执行MapReduce任务
---------------------------

修改配置文件
======================

修改hadoop/etc/hadoop/mapred-site.xml，使其configuration节点内容如下：

    <configuration>
        <property>
            <name>mapreduce.framework.name</name>
            <value>yarn</value>
        </property>
    </configuration>

修改hadoop/etc/hadoop/yarn-site.xml，使其configuration节点内容如下：

    <configuration>
        <property>
            <name>yarn.nodemanager.aux-services</name>
            <value>mapreduce_shuffle</value>
        </property>
    </configuration>

启动yarn
=======================

使用下面的命令启动yarn：

    hadoop/sbin/start-yarn.sh

浏览器访问yarn用户界面
=======================

默认端口为8088，如使用后面的地址访问：http://52.69.38.114:8088/

提交MapReduce任务
=======================

使用之前的命令提交一个MapReduce任务，如：

    hadoop/bin/hadoop jar hadoop-mapreduce-demo-0.0.1-SNAPSHOT.jar com.u3dspace.hadoop.mapreduce.demo.WordCount /mrtest/input /mrtest/output

在浏览器的yarn界面下，可看到提交的任务及执行情况。
